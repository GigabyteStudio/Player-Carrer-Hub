const express = require('express');
const db = require('../database/db');
const formatMoney = require('../utils/formatMoney');
const formatDate = require('../utils/formatDate');

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

    res.render('transfers', {
        title: 'Transferências',
        transfers,
        formatMoney,
        formatDate
    });
});

module.exports = router;