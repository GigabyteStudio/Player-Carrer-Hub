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
    const player = db.prepare('SELECT positions FROM players LIMIT 1').get();
    const isGoalkeeper = player?.positions?.split(',').map(p => p.trim()).includes('GOL');
    const visibleAttributes = isGoalkeeper ? [
      {key:'overall',label:'Overall',short:'GER'},
      {key:'gk_diving',label:'Mergulho',short:'MER'},
      {key:'gk_handling',label:'Manejo',short:'MAN'},
      {key:'gk_kicking',label:'Chute',short:'CHU'},
      {key:'gk_reflexes',label:'Reflexos',short:'REF'},
      {key:'gk_speed',label:'Velocidade',short:'VEL'},
      {key:'gk_positioning',label:'Posicionamento',short:'POS'}
    ] : attributeList;
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

    const changes = visibleAttributes.map(attribute => {
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
        attributeList: visibleAttributes,
        formatDate
    });
});

module.exports = router;