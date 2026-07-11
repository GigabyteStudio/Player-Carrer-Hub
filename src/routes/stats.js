const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      cs.*,
      cc.final_position,
      s.name AS season_name,
      c.name AS club_name,
      comp.name AS competition_name,
      comp.category AS competition_category
    FROM career_stats cs
    JOIN competition_campaigns cc ON cc.id = cs.campaign_id
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id
    ORDER BY s.start_date DESC, c.name ASC, comp.name ASC
  `).all();

  const campaigns = db.prepare(`
    SELECT 
      cc.id,
      s.name AS season_name,
      c.name AS club_name,
      comp.name AS competition_name
    FROM competition_campaigns cc
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id
    WHERE cc.id NOT IN (
      SELECT campaign_id FROM career_stats
    )
    ORDER BY s.start_date DESC, c.name ASC, comp.name ASC
  `).all();

  res.render('manage-stats', {
    title: 'Estatísticas',
    stats,
    campaigns
  });
});

router.post('/adicionar', (req, res) => {
  const {
    campaign_id,
    games,
    goals,
    assists,
    yellow_cards,
    second_yellow_cards,
    red_cards,
    average_rating,
    top_scorer,
    top_assister
  } = req.body;

  db.prepare(`
    INSERT INTO career_stats
    (campaign_id, games, goals, assists, yellow_cards, second_yellow_cards, red_cards, average_rating, top_scorer, top_assister)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaign_id,
    games || 0,
    goals || 0,
    assists || 0,
    yellow_cards || 0,
    second_yellow_cards || 0,
    red_cards || 0,
    average_rating || null,
    top_scorer ? 1 : 0,
    top_assister ? 1 : 0
  );

  res.redirect('/gerenciar/estatisticas');
});

router.get('/editar/:id', (req, res) => {
  const stat = db.prepare(`
    SELECT 
      cs.*,
      s.name AS season_name,
      c.name AS club_name,
      comp.name AS competition_name
    FROM career_stats cs
    JOIN competition_campaigns cc ON cc.id = cs.campaign_id
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id
    WHERE cs.id = ?
  `).get(req.params.id);

  res.render('edit-stat', {
    title: 'Editar Estatística',
    stat
  });
});

router.post('/editar/:id', (req, res) => {
  const { id } = req.params;

  const {
    games,
    goals,
    assists,
    yellow_cards,
    second_yellow_cards,
    red_cards,
    average_rating,
    top_scorer,
    top_assister
  } = req.body;

  db.prepare(`
    UPDATE career_stats
    SET games = ?, goals = ?, assists = ?, yellow_cards = ?, second_yellow_cards = ?, red_cards = ?, average_rating = ?, top_scorer = ?, top_assister = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    games || 0,
    goals || 0,
    assists || 0,
    yellow_cards || 0,
    second_yellow_cards || 0,
    red_cards || 0,
    average_rating || null,
    top_scorer ? 1 : 0,
    top_assister ? 1 : 0,
    id
  );

  res.redirect('/gerenciar/estatisticas');
});

router.post('/excluir/:id', (req, res) => {
  db.prepare('DELETE FROM career_stats WHERE id = ?').run(req.params.id);
  res.redirect('/gerenciar/estatisticas');
});

module.exports = router;