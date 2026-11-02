const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const { slug } = require('./namedImages');

const folder = path.join(__dirname, '../../public/uploads/countries');
const validExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function syncCountryFlags() {
  if (!fs.existsSync(folder)) return 0;

  const files = fs.readdirSync(folder, { withFileTypes: true })
    .filter(entry => entry.isFile() && validExtensions.has(path.extname(entry.name).toLowerCase()))
    .map(entry => ({
      filename: entry.name,
      key: slug(path.parse(entry.name).name),
      timestamp: fs.statSync(path.join(folder, entry.name)).mtimeMs
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const byName = new Map();
  for (const file of files) {
    if (!byName.has(file.key)) byName.set(file.key, file.filename);
  }

  const countries = db.prepare('SELECT id, name, flag FROM countries').all();
  const update = db.prepare('UPDATE countries SET flag = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  let linked = 0;

  db.transaction(() => {
    for (const country of countries) {
      const filename = byName.get(slug(country.name));
      if (!filename) continue;

      // Não sobrescreve um vínculo já válido. Corrige referências antigas
      // quando o arquivo apontado deixou de existir.
      if (country.flag && country.flag.startsWith('/uploads/countries/')) {
        const currentFilename = path.basename(country.flag);
        if (fs.existsSync(path.join(folder, currentFilename))) continue;
      }
      if (country.flag && !country.flag.startsWith('/uploads/countries/')) continue;

      const url = `/uploads/countries/${encodeURIComponent(filename)}`;
      if (country.flag !== url) {
        update.run(url, country.id);
        linked++;
      }
    }
  })();

  return linked;
}

module.exports = syncCountryFlags;
