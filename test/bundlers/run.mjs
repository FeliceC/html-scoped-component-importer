import { cpSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as buildWithVite } from 'vite';
import { build as buildWithEsbuild } from 'esbuild';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import rollupEsbuild from 'rollup-plugin-esbuild';
import webpack from 'webpack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryOf = bundlerName => path.resolve(__dirname, `fixture/entries/${bundlerName}.ts`);
const outputDirectoryOf = bundlerName => path.resolve(__dirname, `dist/${bundlerName}`);

const bundlerBuilds = {
  webpack: () => new Promise((resolve, reject) => {
    webpack({
      mode: 'production',
      entry: entryOf('webpack'),
      output: { path: outputDirectoryOf('webpack'), filename: 'bundle.js', module: true, chunkFormat: 'module' },
      experiments: { outputModule: true },
      resolve: { extensions: ['.ts', '.js'], alias: { COMPONENTS: false } },
      module: { rules: [{ test: /\.ts$/, loader: 'ts-loader', options: { transpileOnly: true, compilerOptions: { rootDir: path.resolve(__dirname, '../..') } } }] }
    }, (compilerError, stats) => {
      if (compilerError) return reject(compilerError);
      if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')));
      resolve();
    });
  }),
  vite: () => buildWithVite({
    configFile: path.resolve(__dirname, 'vite.config.mjs'),
    logLevel: 'warn'
  }),
  esbuild: () => buildWithEsbuild({
    entryPoints: { bundle: entryOf('esbuild') },
    bundle: true,
    splitting: true,
    platform: 'browser',
    format: 'esm',
    outdir: outputDirectoryOf('esbuild')
  }),
  rollup: async () => {
    const bundle = await rollup({
      input: entryOf('rollup'),
      plugins: [nodeResolve({ extensions: ['.ts', '.js'] }), rollupEsbuild()]
    });
    await bundle.write({ dir: outputDirectoryOf('rollup'), format: 'es', entryFileNames: 'bundle.js' });
    await bundle.close();
  }
};

let failedBuildCount = 0;

for (let [bundlerName, runBuild] of Object.entries(bundlerBuilds)) {
  process.stdout.write(`  building ${bundlerName}... `);
  try {
    rmSync(outputDirectoryOf(bundlerName), { recursive: true, force: true });
    await runBuild();
    cpSync(path.resolve(__dirname, 'fixture/index.html'), path.resolve(outputDirectoryOf(bundlerName), 'index.html'));
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
