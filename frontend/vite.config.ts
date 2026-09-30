import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readdirSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export default defineConfig({
  plugins: [react(), {name:'offline-shell',writeBundle(){
    const assets=readdirSync('dist/assets').map(name=>`/assets/${name}`);
    writeFileSync('dist/app-shell.json',JSON.stringify(['/', '/index.html','/icon.svg','/manifest.webmanifest',...assets]));
    const version=createHash('sha256').update(assets.join(',')).digest('hex').slice(0,12);
    writeFileSync('dist/sw.js',readFileSync('public/sw.js','utf8').replace('__BUILD_VERSION__',version));
  }}],
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/media': 'http://127.0.0.1:8000' } },
  test: { include: ['src/**/*.test.ts'] },
});
