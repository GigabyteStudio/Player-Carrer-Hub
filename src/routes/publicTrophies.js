const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
    const trophyGroups = db.prepare(`
    SELECT 
      t.*,
      COUNT(te.id) AS quantity
    FROM trophies t
    LEFT JOIN trophy_entries te ON te.trophy_id = t.id
    GROUP BY t.id
    ORDER BY t.importance DESC, quantity DESC, t.name ASC
  `).all();

    const entries = db.prepare(`
    SELECT 
      te.*,
      s.name AS season_name,
      c.name AS club_name,
      c.logo AS club_logo,
      comp.name AS competition_name,
      comp.logo AS competition_logo
    FROM trophy_entries te
    LEFT JOIN seasons s ON s.id = te.season_id
    LEFT JOIN clubs c ON c.id = te.club_id
    LEFT JOIN competitions comp ON comp.id = te.competition_id
    ORDER BY s.start_date DESC, te.id DESC
  `).all();

    const entriesByTrophy = {};

    entries.forEach(entry => {
        if (!entriesByTrophy[entry.trophy_id]) {
            entriesByTrophy[entry.trophy_id] = [];
        }

        entriesByTrophy[entry.trophy_id].push(entry);
    });

    res.render('trophies', {
        title: 'Troféus',
        trophyGroups,
        entriesByTrophy
    });
});

module.exports = router;