const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const countryCodes = require('../data/countries.json');
const images = require('../utils/namedImages');
const syncCountryFlags = require('../utils/syncCountryFlags');

const router = express.Router();
const upload = images.stagingUpload('countries', 'flag');
const display = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

function list() {
  syncCountryFlags();
  const saved = new Map(
    db.prepare('SELECT * FROM countries').all()
      .map(country => [country.name.toLocaleLowerCase('pt-BR'), country])
  );
  return countryCodes.map(country => {
    const name = display.of(country.code);
    return { code: country.code, name, saved: saved.get(name.toLocaleLowerCase('pt-BR')) || null };
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function render(res, status = 200, error = null) {
  try {
    return res.status(status).render('manage-countries', { title: 'Países', countries: list(), error });
  } catch (err) {
    console.error('Erro ao carregar países:', err);
    return res.status(500).send('Não foi possível carregar os países.');
  }
}

router.get('/', (_req, res) => render(res));

router.post('/bandeira', (req, res) => upload(req, res, err => {
  if (err) return render(res, 400, 'Arquivo inválido. Use JPG, PNG ou WebP de até 5 MB.');
  if (!req.file) return render(res, 400, 'Selecione uma imagem JPG, PNG ou WebP.');

  const country = countryCodes.find(item => item.code === req.body.country_code);
  if (!country) {
    images.discard(req.file);
    return render(res, 400, 'País inválido.');
  }
  const name = display.of(country.code);

  try {
    const existing = db.prepare('SELECT * FROM countries WHERE name = ?').get(name);
    const url = images.resolvedUrl('countries', name, req.file);
    images.finalize('countries', name, req.file);

    if (existing) {
      db.prepare('UPDATE countries SET flag = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(url, existing.id);
    } else {
      db.prepare('INSERT INTO countries (name, flag) VALUES (?, ?)').run(name, url);
    }
    res.redirect('/gerenciar/paises');
  } catch (error) {
    console.error(error);
    images.discard(req.file);
    render(res, 500, 'Não foi possível salvar a bandeira.');
  }
}));

router.post('/remover-bandeira/:id', (req, res) => {
  const country = db.prepare('SELECT * FROM countries WHERE id = ?').get(req.params.id);
  if (country) {
    // Remoção explícita apaga a imagem desse país. Caso contrário,
    // a sincronização a encontraria e a vincularia outra vez.
    const directory = images.folder('countries');
    for (const filename of fs.readdirSync(directory)) {
      const ext = path.extname(filename).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
      if (images.slug(path.parse(filename).name) !== images.slug(country.name)) continue;
      fs.rmSync(path.join(directory, filename), { force: true });
    }
    // Remove também a imagem antiga associada diretamente, caso tenha UUID.
    if (country.flag?.startsWith('/uploads/countries/')) {
      const oldName = path.basename(decodeURIComponent(country.flag));
      fs.rmSync(path.join(directory, oldName), { force: true });
    }
    db.prepare('UPDATE countries SET flag = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(country.id);
  }
  res.redirect('/gerenciar/paises');
});

module.exports = router;
