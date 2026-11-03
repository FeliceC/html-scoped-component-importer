import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { build } from 'esbuild';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_NAMES = ['initialScan', 'initialScanManyTypes', 'observedAppend', 'observedRemove'];
const RUNS_PER_SCENARIO = 7;

await build({
  entryPoints: [path.resolve(__dirname, 'main.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: path.resolve(__dirname, 'dist/bundle.js')
});

const browser = await puppeteer.launch();
const pageUrl = pathToFileURL(path.resolve(__dirname, 'index.html')).href;
const report = {};

for (let scenarioName of SCENARIO_NAMES) {
  let timings = [];
  for (let runIndex = 0; runIndex < RUNS_PER_SCENARIO; runIndex++) {
    let page = await browser.newPage();
    await page.goto(pageUrl);
    timings.push(await page.evaluate(name => window.runBenchmarkScenario(name), scenarioName));
    await page.close();
  }
  timings.sort((first, second) => first - second);
  report[scenarioName] = {
    medianMs: Number(timings[Math.floor(timings.length / 2)].toFixed(1)),
    minMs: Number(timings[0].toFixed(1)),
    maxMs: Number(timings[timings.length - 1].toFixed(1))
  };
}

await browser.close();
console.table(report);
