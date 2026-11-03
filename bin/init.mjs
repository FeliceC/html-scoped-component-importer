#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';

const PACKAGE_NAME = 'html-scoped-component-importer';

const Bundler = Object.freeze({
  VITE: 'vite',
  WEBPACK: 'webpack',
  ROLLUP: 'rollup',
  ESBUILD: 'esbuild'
});

const SUPPORTED_BUNDLERS = Object.values(Bundler);

function readDependencyNames(projectDirectory) {
  const packageJsonPath = path.join(projectDirectory, 'package.json');
  if (!existsSync(packageJsonPath)) return [];
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
}

function listComponentNames(componentsDirectory, extension) {
  if (!existsSync(componentsDirectory)) return [];
  return readdirSync(componentsDirectory)
    .filter(fileName => fileName.endsWith(extension) && !fileName.endsWith(`.d${extension}`))
    .map(fileName => path.basename(fileName, extension));
}

function buildLoaderSource({ bundler, isTypeScript, componentsFolderName, componentNames }) {
  const extension = isTypeScript ? '.ts' : '.js';
  const componentsPath = `./${componentsFolderName}`;
  const usesComponentConstructor = bundler === Bundler.VITE || bundler === Bundler.ROLLUP;
  const importedTypes = usesComponentConstructor ? 'ComponentConstructor, ComponentLoader' : 'ComponentLoader';
  const typeImport = isTypeScript ? `import type { ${importedTypes} } from '${PACKAGE_NAME}';\n\n` : '';
  const loaderDeclaration = isTypeScript ? 'const loadComponent: ComponentLoader' : 'const loadComponent';
  const moduleType = isTypeScript ? '<{ default: ComponentConstructor }>' : '';

  const loaderBodies = {
    [Bundler.VITE]: () => [
      `const componentModules = import.meta.glob${moduleType}('${componentsPath}/*${extension}');`,
      '',
      `${loaderDeclaration} = name => componentModules[\`${componentsPath}/\${name}${extension}\`]();`
    ],
    [Bundler.WEBPACK]: () => [
      `${loaderDeclaration} = name => import(\`${componentsPath}/\${name}\`);`
    ],
    [Bundler.ESBUILD]: () => [
      `${loaderDeclaration} = name => import(\`${componentsPath}/\${name}${extension}\`);`
    ],
    [Bundler.ROLLUP]: () => [
      `const componentLoaders${isTypeScript ? ': Record<string, () => Promise<{ default: ComponentConstructor }>>' : ''} = {`,
      ...componentNames.map(componentName => `  ${componentName}: () => import('${componentsPath}/${componentName}'),`),
      '};',
      '',
      `${loaderDeclaration} = name => componentLoaders[name]();`
    ]
  };

  return `${typeImport}${loaderBodies[bundler]().join('\n')}\n\nexport default loadComponent;\n`;
}

function buildNextSteps(bundler) {
  const bundlerNotes = {
    [Bundler.VITE]: [],
    [Bundler.WEBPACK]: [
      'Add to webpack.config.js, so webpack skips the library\'s legacy import:',
      '  resolve: { alias: { COMPONENTS: false } }'
    ],
    [Bundler.ESBUILD]: [
      'Build with bundle: true, format: \'esm\' and splitting: true to get one chunk per component.'
    ],
    [Bundler.ROLLUP]: [
      'Add @rollup/plugin-node-resolve to your Rollup plugins.',
      'Add a line to componentLoaders whenever you create a component.'
    ]
  };

  return [
    'Next steps:',
    '',
    `  import { ComponentDispatcher } from '${PACKAGE_NAME}';`,
    "  import loadComponent from './componentLoader';",
    '',
    '  const dispatcher = new ComponentDispatcher({ loadComponent });',
    '  await dispatcher.importAsyncComponents();',
    '',
    ...bundlerNotes[bundler]
  ].join('\n');
}

function createPrompt() {
  const lineReader = createInterface({ input: process.stdin });
  // the iterator buffers lines, question() drops answers piped before it is called
  const lines = lineReader[Symbol.asyncIterator]();
  return {
    async question(text) {
      process.stdout.write(text);
      const { value } = await lines.next();
      return value ?? '';
    },
    close: () => lineReader.close()
  };
}

async function askBundler(prompt, detectedBundlers) {
  if (detectedBundlers.length === 1) {
    console.log(`Detected bundler: ${detectedBundlers[0]}`);
    return detectedBundlers[0];
  }
  const choices = detectedBundlers.length > 1 ? detectedBundlers : SUPPORTED_BUNDLERS;
  const intro = detectedBundlers.length > 1 ? 'Several bundlers found.' : 'No supported bundler found in package.json.';
  console.log(`${intro} Which one builds your pages?`);
  choices.forEach((bundler, index) => console.log(`  ${index + 1}) ${bundler}`));
  const answer = (await prompt.question(`Choice [1-${choices.length}] (1): `)).trim();
  const chosenBundler = choices[(Number(answer) || 1) - 1];
  if (!chosenBundler) throw new Error(`Invalid choice: ${answer}`);
  return chosenBundler;
}

async function runInit(projectDirectory) {
  const prompt = createPrompt();
  try {
    const dependencyNames = readDependencyNames(projectDirectory);
    const bundler = await askBundler(prompt, SUPPORTED_BUNDLERS.filter(name => dependencyNames.includes(name)));

    const componentsAnswer = (await prompt.question('Components folder (src/components): ')).trim();
    const componentsDirectory = path.resolve(projectDirectory, componentsAnswer || 'src/components');
    const isTypeScript = existsSync(path.join(projectDirectory, 'tsconfig.json'));
    const extension = isTypeScript ? '.ts' : '.js';
    const loaderPath = path.join(path.dirname(componentsDirectory), `componentLoader${extension}`);

    if (existsSync(loaderPath)) {
      console.error(`${path.relative(projectDirectory, loaderPath)} already exists: nothing written.`);
      process.exitCode = 1;
      return;
    }

    const componentNames = listComponentNames(componentsDirectory, extension);
    writeFileSync(loaderPath, buildLoaderSource({
      bundler,
      isTypeScript,
      componentsFolderName: path.basename(componentsDirectory),
      componentNames
    }));
    console.log(`\nCreated ${path.relative(projectDirectory, loaderPath)}\n`);
    console.log(buildNextSteps(bundler));
  } finally {
    prompt.close();
  }
}

const [command] = process.argv.slice(2);
if (command !== 'init') {
  console.log(`Usage: npx ${PACKAGE_NAME} init`);
  process.exitCode = command ? 1 : 0;
} else {
  await runInit(process.cwd());
}
