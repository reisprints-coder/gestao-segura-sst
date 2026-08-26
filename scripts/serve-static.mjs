import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] || '.';
const port = Number(process.env.PORT || 8080);
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const safePath = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = join(root, safePath === '/' ? 'index.html' : safePath);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(root, 'index.html');
  response.setHeader('Content-Type', `${types[extname(filePath)] || 'application/octet-stream'}; charset=utf-8`);
  createReadStream(filePath).pipe(response);
}).listen(port, () => console.log(`Gestão Segura SST: http://localhost:${port}`));
