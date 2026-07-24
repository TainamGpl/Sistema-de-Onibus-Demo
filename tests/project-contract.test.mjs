import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const approvedScreenshotSha256 =
  '38d386a319e400173e0a507e2937158b977431b52e4f85e9686e22b1cfce3197';
const approvedMitLicense = `MIT License

Copyright (c) 2026 Tainã Lopes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const forbiddenPublicPatterns = [
  ['fetch', /\bfetch\s*\(/i],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/i],
  ['WebSocket', /\bWebSocket\b/i],
  ['navigator.sendBeacon', /\bnavigator\s*\.\s*sendBeacon\s*\(/i],
  ['EventSource', /\b(?:new\s+)?EventSource\s*\(/i],
  [
    'form action remoto',
    /<form\b[^>]*\baction\s*=\s*(?:["']\s*)?(?:https?:)?\/\//i,
  ],
  [
    'formaction remoto',
    /\bformaction\s*=\s*(?:["']\s*)?(?:https?:)?\/\//i,
  ],
  [
    'atribuição remota de .action',
    /\b[a-z_$][\w$]*\s*\.\s*action\s*=\s*["'`]\s*(?:https?:)?\/\//i,
  ],
];

async function source(path) {
  return readFile(resolve(root, path), 'utf8');
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );

  return nestedFiles.flat();
}

function normalizeText(content) {
  return content.replace(/\r\n/g, '\n').trimEnd();
}

function isTextContent(content) {
  return !content.includes(0);
}

function findOutboundViolations(sources) {
  const violations = [];

  for (const { filePath, content } of sources) {
    for (const [label, pattern] of forbiddenPublicPatterns) {
      if (pattern.test(content)) {
        violations.push(`${label} encontrado em ${filePath}`);
      }
    }
  }

  return violations;
}

test('README apresenta a demo segura e a captura aprovada', async () => {
  const readme = await source('README.md');

  assert.match(
    readme,
    /https:\/\/sistema-onibus-taina\.tainalopesgpl\.chatgpt\.site/,
  );
  assert.match(
    readme,
    /!\[[^\]]+\]\(docs\/images\/onibus-preview\.png\)/,
  );
  assert.match(readme, /interface pública sanitizada/);
});

test('LICENSE corresponde exatamente ao modelo MIT aprovado', async () => {
  const license = await source('LICENSE');

  assert.equal(normalizeText(license), normalizeText(approvedMitLicense));
});

test('captura pública corresponde exatamente ao arquivo aprovado', async () => {
  const screenshot = await readFile(
    resolve(root, 'docs', 'images', 'onibus-preview.png'),
  );
  const sha256 = createHash('sha256').update(screenshot).digest('hex');

  assert.equal(sha256, approvedScreenshotSha256);
});

test('workflow usa Node 22 e executa testes e build', async () => {
  const workflow = await source('.github/workflows/ci.yml');

  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /run:\s*npm test/);
  assert.match(workflow, /run:\s*npm run build/);
});

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
  assert.doesNotMatch(
    script,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|DATABASE_URL|JWT_SECRET/,
  );
});

test('contrato reconhece todos os vetores de saída bloqueados', () => {
  const fixtures = [
    ['fetch', 'fetch("/api")', 'fetch'],
    ['XMLHttpRequest', 'new XMLHttpRequest()', 'XMLHttpRequest'],
    ['WebSocket', 'new WebSocket("wss://example.test")', 'WebSocket'],
    [
      'sendBeacon',
      'navigator.sendBeacon("/collect", payload)',
      'navigator.sendBeacon',
    ],
    ['EventSource', 'new EventSource("/events")', 'EventSource'],
    [
      'form action HTTPS',
      '<form action="https://example.test/collect"></form>',
      'form action remoto',
    ],
    [
      'form action protocol-relative',
      '<form action="//example.test/collect"></form>',
      'form action remoto',
    ],
    [
      'formaction remoto',
      '<button formaction="https://example.test/collect">Enviar</button>',
      'formaction remoto',
    ],
    [
      'atribuição remota de action',
      'form.action = "https://example.test/collect"',
      'atribuição remota de .action',
    ],
  ];

  const missedFixtures = fixtures.flatMap(
    ([fixtureName, content, expectedViolation]) => {
      const violations = findOutboundViolations([
        { filePath: `fixture-${fixtureName}`, content },
      ]);
      return violations.some((violation) => violation.includes(expectedViolation))
        ? []
        : [fixtureName];
    },
  );

  assert.deepEqual(missedFixtures, []);
});

test('contrato permite formulários locais sem saída de rede', () => {
  const localForms = [
    '<form class="search-box" role="search">',
    '<form action="/linhas" method="get">',
    '<button formaction="?regiao=norte">Filtrar</button>',
  ];

  const violations = findOutboundViolations(
    localForms.map((content, index) => ({
      filePath: `fixture-form-local-${index}`,
      content,
    })),
  );

  assert.deepEqual(violations, []);
});

test('todos os arquivos texto públicos permanecem sem saída de rede', async () => {
  const publicRoot = resolve(root, 'public');
  const files = await listFiles(publicRoot);
  const fileContents = await Promise.all(
    files.map(async (filePath) => ({
      filePath,
      content: await readFile(filePath),
    })),
  );
  const sources = fileContents
    .filter(({ content }) => isTextContent(content))
    .map(({ filePath, content }) => ({
      filePath,
      content: content.toString('utf8'),
    }));

  assert.deepEqual(findOutboundViolations(sources), []);
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
