const express = require('express');
const db = require('../database/db');
const formatMoney = require('../utils/formatMoney');
const formatDate = require("../utils/formatDate");

const router = express.Router();

router.get('/', (req, res) => {
    const transfers = db.prepare(`
    SELECT 
      t.*,
      s.name AS season_name,

      from_club.name AS from_club_name,
      from_club.logo AS from_club_logo,

      to_club.name AS to_club_name,
      to_club.logo AS to_club_logo

    FROM transfers t
    JOIN seasons s ON s.id = t.season_id
    LEFT JOIN clubs from_club ON from_club.id = t.from_club_id
    JOIN clubs to_club ON to_club.id = t.to_club_id

    ORDER BY t.date DESC
  `).all();

    const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC
  `).all();

    const clubs = db.prepare(`
    SELECT * FROM clubs
    ORDER BY name ASC
  `).all();

    res.render('manage-transfers', {
        title: 'Transferências',
        transfers,
        seasons,
        clubs,
        formatMoney,
        formatDate
    });
});

router.post('/adicionar', (req, res) => {
    const {
        season_id,
        date,
        from_club_id,
        to_club_id,
        market_value,
        transfer_fee,
        contract_until
    } = req.body;

    db.prepare(`
    INSERT INTO transfers
    (season_id, date, from_club_id, to_club_id, market_value, transfer_fee, contract_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
        season_id,
        date,
        from_club_id || null,
        to_club_id,
        market_value || null,
        transfer_fee || 0,
        contract_until || null
    );

    res.redirect('/gerenciar/transferencias');
});

router.get('/editar/:id', (req, res) => {
    const transfer = db.prepare(`
    SELECT * FROM transfers WHERE id = ?
  `).get(req.params.id);

    const seasons = db.prepare(`
    SELECT * FROM seasons
    ORDER BY start_date DESC
  `).all();

    const clubs = db.prepare(`
    SELECT * FROM clubs
    ORDER BY name ASC
  `).all();

    res.render('edit-transfer', {
        title: 'Editar Transferência',
        transfer,
        seasons,
        clubs
    });
});

router.post('/editar/:id', (req, res) => {
    const { id } = req.params;

    const {
        season_id,
        date,
        from_club_id,
        to_club_id,
        market_value,
        transfer_fee,
        contract_until
    } = req.body;

    db.prepare(`
    UPDATE transfers
    SET season_id = ?, date = ?, from_club_id = ?, to_club_id = ?,
        market_value = ?, transfer_fee = ?, contract_until = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
        season_id,
        date,
        from_club_id || null,
        to_club_id,
        market_value || null,
        transfer_fee || 0,
        contract_until || null,
        id
    );

    res.redirect('/gerenciar/transferencias');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare('DELETE FROM transfers WHERE id = ?').run(req.params.id);
    res.redirect('/gerenciar/transferencias');
});

module.exports = router;