const express = require('express');
const db = require('../database/db');

const router = express.Router();

function calculateTotals(rows) {
    const totals = rows.reduce((acc, row) => {
        acc.games += row.games || 0;
        acc.goals += row.goals || 0;
        acc.assists += row.assists || 0;
        acc.yellow_cards += row.yellow_cards || 0;
        acc.second_yellow_cards += row.second_yellow_cards || 0;
        acc.red_cards += row.red_cards || 0;
        acc.top_scorer += row.top_scorer || 0;
        acc.top_assister += row.top_assister || 0;

        if (row.average_rating) {
            acc.rating_sum += Number(row.average_rating);
            acc.rating_count += 1;
        }

        return acc;
    }, {
        games: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        second_yellow_cards: 0,
        red_cards: 0,
        top_scorer: 0,
        top_assister: 0,
        rating_sum: 0,
        rating_count: 0
    });

    totals.goals_average = totals.games > 0 ? (totals.goals / totals.games).toFixed(2) : '0.00';
    totals.assists_average = totals.games > 0 ? (totals.assists / totals.games).toFixed(2) : '0.00';
    totals.average_rating = totals.rating_count > 0 ? (totals.rating_sum / totals.rating_count).toFixed(2) : '-';

    return totals;
}

router.get('/', (req, res) => {
    const selectedSeasonId = req.query.season_id || '';
    const selectedClubId = req.query.club_id || '';
    const selectedCategory = req.query.category || '';
    const selectedCompetitionId = req.query.competition_id || '';

    const seasons = db.prepare(`
    SELECT * FROM seasons 
    ORDER BY start_date DESC
    `).all();

    const clubs = db.prepare(`
    SELECT * FROM clubs 
    ORDER BY name ASC
    `).all();

    const categories = db.prepare(`
    SELECT DISTINCT category
    FROM competitions
    WHERE category IS NOT NULL
    AND category <> ''
    ORDER BY category ASC
    `).all();

    const competitions = db.prepare(`
    SELECT * FROM competitions 
    ORDER BY name ASC
    `).all();

    const careerStats = db.prepare(`
    SELECT
      comp.id AS competition_id,
      comp.name AS competition_name,
      comp.logo AS competition_logo,

      SUM(cs.games) AS games,
      SUM(cs.goals) AS goals,
      SUM(cs.assists) AS assists,
      SUM(cs.yellow_cards) AS yellow_cards,
      SUM(cs.second_yellow_cards) AS second_yellow_cards,
      SUM(cs.red_cards) AS red_cards,
      SUM(cs.top_scorer) AS top_scorer,
      SUM(cs.top_assister) AS top_assister,
      AVG(cs.average_rating) AS average_rating

    FROM career_stats cs
    JOIN competition_campaigns cc ON cc.id = cs.campaign_id
    JOIN competitions comp ON comp.id = cc.competition_id

    GROUP BY comp.id
    ORDER BY games DESC, goals DESC
  `).all();

    const where = [];
    const params = [];

    if (selectedSeasonId) {
        where.push('cc.season_id = ?');
        params.push(selectedSeasonId);
    }

    if (selectedClubId) {
        where.push('cc.club_id = ?');
        params.push(selectedClubId);
    }

    if (selectedCategory) {
        where.push('comp.category = ?');
        params.push(selectedCategory);
    }

    if (selectedCompetitionId) {
        where.push('cc.competition_id = ?');
        params.push(selectedCompetitionId);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const filteredStats = db.prepare(`
    SELECT
      s.name AS season_name,
      c.name AS club_name,
      c.logo AS club_logo,
      comp.name AS competition_name,
      comp.logo AS competition_logo,

      cs.games,
      cs.goals,
      cs.assists,
      cs.yellow_cards,
      cs.second_yellow_cards,
      cs.red_cards,
      cs.average_rating,
      cs.top_scorer,
      cs.top_assister

    FROM career_stats cs
    JOIN competition_campaigns cc ON cc.id = cs.campaign_id
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id

    ${whereClause}

    ORDER BY s.start_date DESC, comp.name ASC
  `).all(...params);

    res.render('stats', {
        title: 'Estatísticas',
        careerStats,
        careerTotals: calculateTotals(careerStats),
        filteredStats,
        filteredTotals: calculateTotals(filteredStats),
        seasons,
        clubs,
        categories,
        competitions,
        selectedSeasonId,
        selectedClubId,
        selectedCategory,
        selectedCompetitionId
    });
});

module.exports = router;