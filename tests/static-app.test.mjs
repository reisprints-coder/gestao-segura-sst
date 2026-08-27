import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('build contém todos os módulos publicados', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  for (const asset of ['epi-enhancements.js', 'enhancements.css', 'workforce-controls.js', 'service-worker.js']) {
    if (asset === 'service-worker.js') await access(`dist/${asset}`);
    else assert.match(html, new RegExp(asset.replace('.', '\\.')));
  }
});

test('dashboard usa o usuário conectado e não contém controle de gastos', async () => {
  const app = await readFile('dist/app.js', 'utf8');
  assert.doesNotMatch(app, /Bom dia, João Victor/);
  assert.match(app, /state\.profile\?\.full_name/);
  assert.doesNotMatch(app, /state\.expenses|Controle de gastos|Gastos no mês|monthlyBudget/);
});

test('interface não exibe validade nem informações financeiras', async () => {
  const files = await Promise.all([
    'app.js', 'app-enhancements.js', 'epi-enhancements.js', 'workforce-controls.js'
  ].map(file => readFile(`dist/${file}`, 'utf8')));
  const published = files.join('\n');
  assert.doesNotMatch(published, /Validade|vencimento|vencido|Custo unitário|Valor estimado|Valor em estoque|Custo acumulado|R\$/i);
  assert.doesNotMatch(published, /<th>Custo<\/th>|<th>Valor<\/th>/i);
});
test('configuração pública não expõe chave administrativa', async () => {
  const config = await readFile('dist/config.js', 'utf8');
  assert.doesNotMatch(config, /service_role|sb_secret_/i);
  assert.match(config, /supabasePublishableKey/);
});
