const express = require('express');
const router = express.Router();
const db = require('../database/db');
const syncCountryFlags = require('../utils/syncCountryFlags');

router.get('/', (_req, res) => {
  try {
    syncCountryFlags();
    const counts = {
      countries: db.prepare('SELECT COUNT(*) AS n FROM countries WHERE flag IS NOT NULL AND flag <> \'\'').get().n,
      seasons: db.prepare('SELECT COUNT(*) AS n FROM seasons').get().n,
      competitions: db.prepare('SELECT COUNT(*) AS n FROM competitions').get().n,
      clubs: db.prepare('SELECT COUNT(*) AS n FROM clubs').get().n
    };
    res.render('manage', { title: 'Gerenciar', counts });
  } catch (error) {
    console.error('Erro ao sincronizar bandeiras:', error);
    res.status(500).send('Não foi possível carregar o gerenciamento.');
  }
});

module.exports = router;
