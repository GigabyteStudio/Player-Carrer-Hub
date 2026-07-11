const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  const campaigns = db.prepare(`
    SELECT 
      cc.*,
      s.name AS season_name,
      c.name AS club_name,
      comp.name AS competition_name,
      comp.category AS competition_category
    FROM competition_campaigns cc
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id
    ORDER BY s.start_date DESC, c.name ASC, comp.name ASC
  `).all();

  const seasons = db.prepare('SELECT * FROM seasons ORDER BY start_date DESC').all();
  const clubs = db.prepare('SELECT * FROM clubs ORDER BY name ASC').all();
  const competitions = db.prepare('SELECT * FROM competitions ORDER BY name ASC').all();

  res.render('manage-campaigns', {
    title: 'Campeonatos',
    campaigns,
    seasons,
    clubs,
    competitions
  });
});

router.post('/adicionar', (req, res) => {
  const { season_id, club_id, competition_id, final_position } = req.body;

  db.prepare(`
    INSERT INTO competition_campaigns
    (season_id, club_id, competition_id, final_position)
    VALUES (?, ?, ?, ?)
  `).run(season_id, club_id, competition_id, final_position);

  res.redirect('/gerenciar/campeonatos');
});

router.get('/editar/:id', (req, res) => {
  const campaign = db.prepare(`
    SELECT * FROM competition_campaigns WHERE id = ?
  `).get(req.params.id);

  const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC
  `).all();

  const clubs = db.prepare(`
    SELECT * FROM clubs
    ORDER BY name ASC
  `).all();

  const competitions = db.prepare(`
    SELECT * FROM competitions
    ORDER BY name ASC
  `).all();

  res.render('edit-campaign', {
    title: 'Editar Campeonato',
    campaign,
    seasons,
    clubs,
    competitions
  });
});

router.post('/editar/:id', (req, res) => {
  const { id } = req.params;
  const { season_id, club_id, competition_id, final_position } = req.body;

  db.prepare(`
    UPDATE competition_campaigns
    SET season_id = ?, club_id = ?, competition_id = ?, final_position = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(season_id, club_id, competition_id, final_position, id);

  res.redirect('/gerenciar/campeonatos');
});

router.post('/excluir/:id', (req, res) => {
  db.prepare('DELETE FROM competition_campaigns WHERE id = ?').run(req.params.id);
  res.redirect('/gerenciar/campeonatos');
});

module.exports = router;