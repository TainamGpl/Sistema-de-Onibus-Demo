import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

async function source(path) {
  return readFile(resolve(root, path), 'utf8');
}

test('oferece as três rotas públicas da demonstração', async () => {
  const pages = await Promise.all([
    source('public/index.html'),
    source('public/linhas.html'),
    source('public/horarios.html'),
  ]);

  for (const page of pages) {
    assert.match(page, /Demonstração independente/);
    assert.match(page, /Sem vínculo oficial/);
    assert.doesNotMatch(page, /\/admin|login|senha|password/i);
  }
});

test('mantém a consulta interativa somente no navegador', async () => {
  const script = await source('public/assets/app.js');

  assert.match(script, /const routes =/);
  assert.match(script, /data-line-search/);
  assert.match(script, /data-region-filter/);
  assert.match(script, /data-day-filter/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket|DATABASE_URL|JWT_SECRET/);
});

test('gera um Worker ESM autocontido e metadados de hospedagem', async () => {
  const build = await source('scripts/build.mjs');
  const hosting = JSON.parse(await source('.openai/hosting.json'));

  assert.deepEqual(
    Object.keys(hosting).sort(),
    hosting.project_id ? ['project_id'] : [],
  );
  if (hosting.project_id) {
    assert.match(hosting.project_id, /^appgprj_[a-z0-9]+$/);
  }
  assert.match(build, /export default/);
  assert.match(build, /dist.+server.+index\.js/s);
  assert.doesNotMatch(build, /process\.env|https?:\/\//);
});

