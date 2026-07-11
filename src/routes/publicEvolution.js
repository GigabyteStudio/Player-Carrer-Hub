const express = require('express');
const db = require('../database/db');
const formatDate = require('../utils/formatDate');

const router = express.Router();

const attributeList = [
    { key: 'overall', label: 'Overall', short: 'GER' },
    { key: 'pace', label: 'Ritmo', short: 'RIT' },
    { key: 'shooting', label: 'Finalização', short: 'FIN' },
    { key: 'passing', label: 'Passes', short: 'PAS' },
    { key: 'dribbling', label: 'Condução', short: 'CON' },
    { key: 'defending', label: 'Defesa', short: 'DEF' },
    { key: 'physical', label: 'Físico', short: 'FÍS' }
];

router.get('/', (req, res) => {
    const history = db.prepare(`
    SELECT
      ap.*,
      s.name AS season_name
    FROM attribute_progress ap
    LEFT JOIN seasons s
      ON ap.date >= s.start_date
      AND ap.date <= s.end_date
    ORDER BY ap.date ASC
  `).all();

    const latestAttributes = history.length ? history[history.length - 1] : null;
    const firstAttributes = history.length ? history[0] : null;

    const changes = attributeList.map(attribute => {
        return {
            ...attribute,
            first: firstAttributes ? firstAttributes[attribute.key] : null,
            latest: latestAttributes ? latestAttributes[attribute.key] : null
        };
    });

    res.render('evolution', {
        title: 'Evolução',
        history,
        latestAttributes,
        changes,
        attributeList,
        formatDate
    });
});

module.exports = router;