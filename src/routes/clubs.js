const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database/db');

const router = express.Router();

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/clubs');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${slugify(req.body.name)}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  const clubs = db.prepare(`
    SELECT 
      clubs.*,
      countries.name AS country_name,
      countries.flag AS country_flag,
      competitions.name AS league_name
    FROM clubs
    LEFT JOIN countries ON countries.id = clubs.country_id
    LEFT JOIN competitions ON competitions.id = clubs.league_id
    ORDER BY clubs.type ASC, clubs.name ASC
  `).all();

  const countries = db.prepare(`
    SELECT * FROM countries
    ORDER BY name ASC
  `).all();

  const leagues = db.prepare(`
    SELECT 
      competitions.*,
      countries.name AS country_name
    FROM competitions
    LEFT JOIN countries ON countries.id = competitions.country_id
    WHERE competitions.category = 'Liga'
    ORDER BY competitions.name ASC
  `).all();

  res.render('manage-clubs', {
    title: 'Clubes',
    clubs,
    countries,
    leagues
  });
});

router.post('/adicionar', upload.single('logo'), (req, res) => {
  const { name, type, league_id } = req.body;

  let finalCountryId = null;
  let finalLeagueId = league_id || null;

  if (type === 'Clube' && league_id) {
    const league = db.prepare(`
      SELECT country_id FROM competitions WHERE id = ?
    `).get(league_id);

    finalCountryId = league ? league.country_id : finalCountryId;
  }

  if (type === 'Seleção') {
    finalLeagueId = null;
  }

  const logo = req.file ? `/uploads/clubs/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO clubs (name, type, country_id, league_id, logo)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, type || 'Clube', finalCountryId, finalLeagueId, logo);

  res.redirect('/gerenciar/clubes');
});

router.get('/editar/:id', (req, res) => {
  const club = db.prepare(`
    SELECT * FROM clubs WHERE id = ?
  `).get(req.params.id);

  const countries = db.prepare(`
    SELECT * FROM countries
    ORDER BY name ASC
  `).all();

  const leagues = db.prepare(`
    SELECT 
      competitions.*,
      countries.name AS country_name
    FROM competitions
    LEFT JOIN countries ON countries.id = competitions.country_id
    WHERE competitions.category = 'Liga'
    ORDER BY competitions.name ASC
  `).all();

  res.render('edit-club', {
    title: 'Editar Clube/Seleção',
    club,
    countries,
    leagues
  });
});

router.post('/editar/:id', upload.single('logo'), (req, res) => {
  const { id } = req.params;
  const { name, type, league_id, current_logo } = req.body;

  let finalCountryId = null;
  let finalLeagueId = league_id || null;

  if (type === 'Clube' && league_id) {
    const league = db.prepare(`
      SELECT country_id FROM competitions WHERE id = ?
    `).get(league_id);

    finalCountryId = league ? league.country_id : finalCountryId;
  }

  if (type === 'Seleção') {
    finalLeagueId = null;
  }

  const logo = req.file ? `/uploads/clubs/${req.file.filename}` : current_logo;

  db.prepare(`
    UPDATE clubs
    SET name = ?, type = ?, country_id = ?, league_id = ?, logo = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, type || 'Clube', finalCountryId, finalLeagueId, logo, id);

  res.redirect('/gerenciar/clubes');
});

router.post('/excluir/:id', (req, res) => {
  db.prepare('DELETE FROM clubs WHERE id = ?').run(req.params.id);
  res.redirect('/gerenciar/clubes');
});

module.exports = router;