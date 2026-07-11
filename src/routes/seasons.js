const express = require('express');
const db = require('../database/db');
const formatDate = require("../utils/formatDate");

const router = express.Router();

router.get('/', (req, res) => {
    const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC, id DESC
  `).all();

    res.render('manage-seasons', {
        title: 'Temporadas',
        seasons,
        formatDate
    });
});

router.post('/adicionar', (req, res) => {
    const { name, start_date, end_date, is_current } = req.body;

    if (is_current) {
        db.prepare('UPDATE seasons SET is_current = 0').run();
    }

    db.prepare(`
    INSERT INTO seasons (name, start_date, end_date, is_current)
    VALUES (?, ?, ?, ?)
  `).run(name, start_date, end_date, is_current ? 1 : 0);

    res.redirect('/gerenciar/temporadas');
});

router.get('/editar/:id', (req, res) => {
    const season = db.prepare(`
    SELECT * FROM seasons WHERE id = ?
  `).get(req.params.id);

    res.render('edit-season', {
        title: 'Editar Temporada',
        season
    });
});

router.post('/editar/:id', (req, res) => {
    const { id } = req.params;
    const { name, start_date, end_date, is_current } = req.body;

    if (is_current) {
        db.prepare('UPDATE seasons SET is_current = 0').run();
    }

    db.prepare(`
    UPDATE seasons
    SET name = ?, start_date = ?, end_date = ?, is_current = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, start_date, end_date, is_current ? 1 : 0, id);

    res.redirect('/gerenciar/temporadas');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare('DELETE FROM seasons WHERE id = ?').run(req.params.id);
    res.redirect('/gerenciar/temporadas');
});

module.exports = router;