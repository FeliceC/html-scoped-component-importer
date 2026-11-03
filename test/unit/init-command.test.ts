// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const INIT_SCRIPT = path.resolve(import.meta.dirname, '../../bin/init.mjs');

function runInit(projectDirectory: string, answers: string[]) {
  return spawnSync(process.execPath, [INIT_SCRIPT, 'init'], {
    cwd: projectDirectory,
    input: answers.map(answer => `${answer}\n`).join(''),
    encoding: 'utf8'
  });
}

describe('init command', () => {
  let projectDirectory: string;

  function createProject({ devDependencies, isTypeScript, componentFiles = [] }: {
    devDependencies: string[];
    isTypeScript: boolean;
    componentFiles?: string[];
  }) {
    writeFileSync(path.join(projectDirectory, 'package.json'), JSON.stringify({
      devDependencies: Object.fromEntries(devDependencies.map(name => [name, '*']))
    }));
    if (isTypeScript) writeFileSync(path.join(projectDirectory, 'tsconfig.json'), '{}');
    mkdirSync(path.join(projectDirectory, 'src/components'), { recursive: true });
    for (let fileName of componentFiles) {
      writeFileSync(path.join(projectDirectory, 'src/components', fileName), 'export default class {}');
    }
  }

  const readLoader = (fileName: string) => readFileSync(path.join(projectDirectory, 'src', fileName), 'utf8');

  beforeEach(() => {
    projectDirectory = mkdtempSync(path.join(tmpdir(), 'init-command-'));
  });

  afterEach(() => {
    rmSync(projectDirectory, { recursive: true, force: true });
  });

  it('generates a typed import.meta.glob loader for a Vite TypeScript project', () => {
    createProject({ devDependencies: ['vite'], isTypeScript: true });

    const result = runInit(projectDirectory, ['']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Detected bundler: vite');
    expect(readLoader('componentLoader.ts')).toBe([
      "import type { ComponentConstructor, ComponentLoader } from 'html-scoped-component-importer';",
      '',
      "const componentModules = import.meta.glob<{ default: ComponentConstructor }>('./components/*.ts');",
      '',
      'const loadComponent: ComponentLoader = name => componentModules[`./components/${name}.ts`]();',
      '',
      'export default loadComponent;',
      ''
    ].join('\n'));
  });

  it('generates an untyped loader and the alias hint for a webpack JavaScript project', () => {
    createProject({ devDependencies: ['webpack'], isTypeScript: false });

    const result = runInit(projectDirectory, ['']);

    expect(readLoader('componentLoader.js')).toContain('const loadComponent = name => import(`./components/${name}`);');
    expect(result.stdout).toContain('resolve: { alias: { COMPONENTS: false } }');
  });

  it('lists the existing components in a Rollup map', () => {
    createProject({ devDependencies: ['rollup'], isTypeScript: true, componentFiles: ['Counter.ts', 'Modal.ts', 'types.d.ts'] });

    runInit(projectDirectory, ['']);

    const loaderSource = readLoader('componentLoader.ts');
    expect(loaderSource).toContain("  Counter: () => import('./components/Counter'),");
    expect(loaderSource).toContain("  Modal: () => import('./components/Modal'),");
    expect(loaderSource).not.toContain('types');
  });

  it('asks which bundler to use when several are installed', () => {
    createProject({ devDependencies: ['vite', 'esbuild'], isTypeScript: true });

    const result = runInit(projectDirectory, ['2', '']);

    expect(result.stdout).toContain('Several bundlers found.');
    expect(readLoader('componentLoader.ts')).toContain('import(`./components/${name}.ts`)');
  });

  it('uses a custom components folder', () => {
    createProject({ devDependencies: ['esbuild'], isTypeScript: false });
    mkdirSync(path.join(projectDirectory, 'app/widgets'), { recursive: true });

    runInit(projectDirectory, ['app/widgets']);

    expect(readFileSync(path.join(projectDirectory, 'app/componentLoader.js'), 'utf8'))
      .toContain('import(`./widgets/${name}.js`)');
  });

  it('never overwrites an existing loader', () => {
    createProject({ devDependencies: ['vite'], isTypeScript: true });
    writeFileSync(path.join(projectDirectory, 'src/componentLoader.ts'), 'mine');

    const result = runInit(projectDirectory, ['']);

    expect(result.status).toBe(1);
    expect(readLoader('componentLoader.ts')).toBe('mine');
  });

  it('prints usage and writes nothing without the init command', () => {
    createProject({ devDependencies: ['vite'], isTypeScript: true });

    const result = spawnSync(process.execPath, [INIT_SCRIPT], { cwd: projectDirectory, encoding: 'utf8' });

    expect(result.stdout).toContain('Usage: npx html-scoped-component-importer init');
    expect(existsSync(path.join(projectDirectory, 'src/componentLoader.ts'))).toBe(false);
  });
});
