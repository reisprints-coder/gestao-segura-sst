import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const outputDirectory = 'dist';
const assets = [
  'index.html', 'styles.css', 'enhancements.css', 'admin-users.css', 'workforce-controls.css',
  'app.js', 'app-enhancements.js', 'epi-enhancements.js', 'epi-signature.js',
  'admin-users.js', 'workforce-controls.js', 'config.js', 'manifest.webmanifest',
  'service-worker.js'
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  const target = join(outputDirectory, asset);
  await mkdir(dirname(target), { recursive: true });
  await cp(asset, target);
}

const html = await readFile(join(outputDirectory, 'index.html'), 'utf8');
for (const requiredAsset of ['epi-enhancements.js', 'enhancements.css', 'service-worker.js']) {
  if (!html.includes(requiredAsset) && requiredAsset !== 'service-worker.js') {
    throw new Error(`index.html não referencia ${requiredAsset}`);
  }
}

console.log(`Build estático concluído: ${assets.length} arquivos em ${outputDirectory}/`);
