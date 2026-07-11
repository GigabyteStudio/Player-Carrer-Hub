const express = require('express');
const db = require('../database/db');
const formatDate = require('../utils/formatDate');

const router = express.Router();

router.get('/', (req, res) => {
    const injuries = db.prepare(`
    SELECT 
      injuries.*,
      seasons.name AS season_name
    FROM injuries
    JOIN seasons ON seasons.id = injuries.season_id
    ORDER BY injuries.injury_date DESC
  `).all();

    const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC
  `).all();

    res.render('manage-injuries', {
        title: 'Lesões',
        injuries,
        seasons,
        formatDate
    });
});

router.post('/adicionar', (req, res) => {
    const {
        season_id,
        injury_name,
        injury_date,
        days_injured,
        games_missed
    } = req.body;

    db.prepare(`
    INSERT INTO injuries
    (season_id, injury_name, injury_date, days_injured, games_missed)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        season_id,
        injury_name,
        injury_date || null,
        days_injured || 0,
        games_missed || 0
    );

    res.redirect('/gerenciar/lesoes');
});

router.get('/editar/:id', (req, res) => {
    const injury = db.prepare(`
    SELECT * FROM injuries WHERE id = ?
  `).get(req.params.id);

    const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC
  `).all();

    res.render('edit-injury', {
        title: 'Editar Lesão',
        injury,
        seasons
    });
});

router.post('/editar/:id', (req, res) => {
    const { id } = req.params;

    const {
        season_id,
        injury_name,
        injury_date,
        days_injured,
        games_missed
    } = req.body;

    db.prepare(`
    UPDATE injuries
    SET season_id = ?, injury_name = ?, injury_date = ?, days_injured = ?, games_missed = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
        season_id,
        injury_name,
        injury_date || null,
        days_injured || 0,
        games_missed || 0,
        id
    );

    res.redirect('/gerenciar/lesoes');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare('DELETE FROM injuries WHERE id = ?').run(req.params.id);
    res.redirect('/gerenciar/lesoes');
});

module.exports = router;