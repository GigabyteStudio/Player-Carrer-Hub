// Migração opcional dos uploads antigos (UUID) para nomes legíveis.
// Execute npm run backup antes de executar este script.
const fs = require('fs');
const path = require('path');
const db = require('../src/database/db');
const images = require('../src/utils/namedImages');
const configs = [
  { table: 'clubs', category: 'clubs', column: 'logo' },
  { table: 'competitions', category: 'competitions', column: 'logo' },
  { table: 'countries', category: 'countries', column: 'flag' }
];
let count = 0;
for (const {table, category, column} of configs) {
  const rows = db.prepare(`SELECT id,name,${column} AS url FROM ${table} WHERE ${column} IS NOT NULL`).all();
  for (const row of rows) {
    const prefix = `/uploads/${category}/`;
    if (!row.url.startsWith(prefix)) continue;
    const oldFilename = row.url.slice(prefix.length);
    if (path.basename(oldFilename) !== oldFilename) continue;
    const extension = path.extname(oldFilename).toLowerCase();
    if (!['.png', '.jpg', '.webp'].includes(extension)) continue;
    const source = path.join(images.folder(category), oldFilename);
    if (!fs.existsSync(source)) continue;
    const targetName = `${images.slug(row.name)}${extension}`;
    const target = path.join(images.folder(category), targetName);
    if (source !== target && !fs.existsSync(target)) fs.copyFileSync(source, target);
    // Mantém o arquivo UUID original por segurança, até que o usuário decida removê-lo.
    const destination = `/uploads/${category}/${targetName}`;
    db.prepare(`UPDATE ${table} SET ${column}=? WHERE id=?`).run(destination, row.id);
    if (row.url !== destination) { console.log(`${row.url} -> ${destination}`); count++; }
  }
}
console.log(`Concluído: ${count} referência(s) atualizada(s). Arquivos antigos preservados.`);
