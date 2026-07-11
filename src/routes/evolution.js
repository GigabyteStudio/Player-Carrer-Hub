const express = require('express');
const db = require('../database/db');
const formatDate = require("../utils/formatDate");

const router = express.Router();

router.get('/', (req, res) => {
    const attributes = db.prepare(`
    SELECT * FROM attribute_progress
    ORDER BY date DESC
  `).all();

    res.render('manage-evolution', {
        title: 'Evolução',
        attributes,
        formatDate
    });
});

router.post('/adicionar', (req, res) => {
    const {
        date,
        age,
        overall,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        market_value,
        salary
    } = req.body;

    db.prepare(`
    INSERT INTO attribute_progress
    (date, age, overall, pace, shooting, passing, dribbling, defending, physical, market_value, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        date,
        age || null,
        overall,
        pace || null,
        shooting || null,
        passing || null,
        dribbling || null,
        defending || null,
        physical || null,
        market_value || null,
        salary || null
    );

    res.redirect('/gerenciar/evolucao');
});

router.get('/editar/:id', (req, res) => {
    const attribute = db.prepare(`
    SELECT * FROM attribute_progress WHERE id = ?
  `).get(req.params.id);

    res.render('edit-evolution', {
        title: 'Editar Evolução',
        attribute
    });
});

router.post('/editar/:id', (req, res) => {
    const { id } = req.params;

    const {
        date,
        age,
        overall,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        market_value,
        salary
    } = req.body;

    db.prepare(`
    UPDATE attribute_progress
    SET date = ?, age = ?, overall = ?, pace = ?, shooting = ?, passing = ?, dribbling = ?,
        defending = ?, physical = ?, market_value = ?, salary = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
        date,
        age || null,
        overall,
        pace || null,
        shooting || null,
        passing || null,
        dribbling || null,
        defending || null,
        physical || null,
        market_value || null,
        salary || null,
        id
    );

    res.redirect('/gerenciar/evolucao');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare('DELETE FROM attribute_progress WHERE id = ?').run(req.params.id);
    res.redirect('/gerenciar/evolucao');
});

module.exports = router;