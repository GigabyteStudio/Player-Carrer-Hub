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

    const summary = db.prepare(`
    SELECT
      COUNT(*) AS total_injuries,
      COALESCE(SUM(days_injured), 0) AS total_days_injured,
      COALESCE(SUM(games_missed), 0) AS total_games_missed
    FROM injuries
  `).get();

    res.render('injuries', {
        title: 'Lesões',
        injuries,
        summary,
        formatDate
    });
});

module.exports = router;