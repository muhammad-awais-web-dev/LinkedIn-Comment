import * as esbuild from 'esbuild';
import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isDev = isWatch || process.argv.includes('--dev');
const outDir = resolve(__dirname, 'dist');

// Clean output directory
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true });
}
mkdirSync(outDir, { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  target: ['chrome120'],
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
  },
};

async function build() {
  console.log(`\n🔨 Building extension (${isDev ? 'dev' : 'prod'})...\n`);

  // --- Content Script (IIFE, single self-contained file) ---
  const contentOpts = {
    ...commonOptions,
    entryPoints: [resolve(__dirname, 'src/contentScripts/index.ts')],
    outfile: resolve(outDir, 'contentScript.js'),
    format: 'iife',
  };

  // --- Service Worker (IIFE, single self-contained file) ---
  const bgOpts = {
    ...commonOptions,
    entryPoints: [resolve(__dirname, 'src/background/serviceWorker.ts')],
    outfile: resolve(outDir, 'serviceWorker.js'),
    format: 'iife',
  };

  // --- Popup React App (IIFE, bundles React) ---
  const popupOpts = {
    ...commonOptions,
    entryPoints: [resolve(__dirname, 'src/popup/main.tsx')],
    outfile: resolve(outDir, 'popup/main.js'),
    format: 'iife',
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
  };

  if (isWatch) {
    const [contentCtx, bgCtx, popupCtx] = await Promise.all([
      esbuild.context(contentOpts),
      esbuild.context(bgOpts),
      esbuild.context(popupOpts),
    ]);

    await Promise.all([
      contentCtx.watch(),
      bgCtx.watch(),
      popupCtx.watch(),
    ]);

    console.log('\n👀 Watching for changes...\n');
  } else {
    await Promise.all([
      esbuild.build(contentOpts),
      esbuild.build(bgOpts),
      esbuild.build(popupOpts),
    ]);
  }

  // Copy static assets
  cpSync(
    resolve(__dirname, 'manifest.json'),
    resolve(outDir, 'manifest.json')
  );
  cpSync(
    resolve(__dirname, 'src/popup/index.html'),
    resolve(outDir, 'popup/index.html')
  );

  console.log('\n✅ Build complete → dist/\n');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
