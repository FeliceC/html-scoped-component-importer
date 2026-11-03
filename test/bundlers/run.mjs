import { cpSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as buildWithVite } from 'vite';
import { build as buildWithEsbuild } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDirectory = path.resolve(__dirname, 'fixture/components');

const bundlerBuilds = {
  vite: () => buildWithVite({
    configFile: path.resolve(__dirname, 'vite.config.js'),
    logLevel: 'warn',
  }),
  esbuild: () => buildWithEsbuild({
    entryPoints: [path.resolve(__dirname, 'fixture/main.ts')],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    alias: { COMPONENTS: componentsDirectory },
    outfile: path.resolve(__dirname, 'dist/esbuild/bundle.js'),
  }),
};

let failedBuildCount = 0;

for (let [bundlerName, runBuild] of Object.entries(bundlerBuilds)) {
  process.stdout.write(`  building ${bundlerName}... `);
  try {
    await runBuild();
    cpSync(
      path.resolve(__dirname, 'fixture/index.html'),
      path.resolve(__dirname, `dist/${bundlerName}/index.html`)
    );
    console.log('OK');
  } catch (buildError) {
    console.error('FAIL');
    console.error(buildError);
    failedBuildCount++;
  }
}

if (failedBuildCount > 0) {
  console.error(`\n${failedBuildCount} build(s) failed`);
  process.exit(1);
}
console.log('\nAll builds succeeded');
