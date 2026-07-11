const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const formatMoney = require('../utils/formatMoney');
const formatDate = require("../utils/formatDate");

const router = express.Router();

function slugify(text) {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/players');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${slugify(req.body.name || 'jogador')}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
    const player = db.prepare(`
    SELECT 
      p.*,
      countries.name AS nationality_name,
      countries.flag AS nationality_flag
    FROM players p
    LEFT JOIN countries ON countries.id = p.nationality_id
    LIMIT 1
    `).get();

    const currentTransfer = db.prepare(`
    SELECT
      t.*,
      to_club.name AS club_name,
      to_club.logo AS club_logo,
      leagues.name AS league_name
    FROM transfers t
    JOIN clubs to_club ON to_club.id = t.to_club_id
    LEFT JOIN competitions leagues ON leagues.id = to_club.league_id
    ORDER BY t.date DESC
    LIMIT 1
    `).get();

    const latestAttributes = db.prepare(`
    SELECT *
    FROM attribute_progress
    ORDER BY date DESC
    LIMIT 1
    `).get();

    const trophies = db.prepare(`
    SELECT 
    t.*,
    COUNT(te.id) AS quantity
    FROM trophies t
    LEFT JOIN trophy_entries te ON te.trophy_id = t.id
    GROUP BY t.id
    HAVING quantity > 0
    ORDER BY t.importance DESC, quantity DESC, t.name ASC
    `).all();

    const careerStats = db.prepare(`
    SELECT
    comp.id AS competition_id,
    comp.name AS competition_name,
    comp.logo AS competition_logo,

    SUM(cs.games) AS games,
    SUM(cs.goals) AS goals,
    SUM(cs.assists) AS assists,
    AVG(cs.average_rating) AS average_rating

    FROM career_stats cs
    JOIN competition_campaigns cc ON cc.id = cs.campaign_id
    JOIN competitions comp ON comp.id = cc.competition_id

    GROUP BY comp.id
    ORDER BY games DESC, goals DESC
    LIMIT 5
    `).all();

    const careerTotals = careerStats.reduce((acc, stat) => {
        acc.games += stat.games || 0;
        acc.goals += stat.goals || 0;
        acc.assists += stat.assists || 0;

        if (stat.average_rating) {
            acc.rating_sum += Number(stat.average_rating);
            acc.rating_count += 1;
        }

        return acc;
    }, {
        games: 0,
        goals: 0,
        assists: 0,
        rating_sum: 0,
        rating_count: 0
    });

    careerTotals.average_rating =
        careerTotals.rating_count > 0
            ? (careerTotals.rating_sum / careerTotals.rating_count).toFixed(2)
            : '-';

    careerTotals.goals_average =
        careerTotals.games > 0
            ? (careerTotals.goals / careerTotals.games).toFixed(2)
            : '0.00';

    careerTotals.assists_average =
        careerTotals.games > 0
            ? (careerTotals.assists / careerTotals.games).toFixed(2)
            : '0.00';

    const overallHistory = db.prepare(`
    SELECT
    ap.date,
    ap.age,
    ap.overall,
    s.name AS season_name
    FROM attribute_progress ap
    LEFT JOIN seasons s
    ON ap.date >= s.start_date
    AND ap.date <= s.end_date
    WHERE ap.overall IS NOT NULL
    ORDER BY ap.date ASC
    `).all();

    const overallValues = overallHistory.map(item => item.overall);

    const overallSummary = {
        min: overallValues.length ? Math.min(...overallValues) : null,
        max: overallValues.length ? Math.max(...overallValues) : null
    }

    const marketHistory = db.prepare(`
    SELECT
    ap.date,
    ap.market_value,
    s.name AS season_name
    FROM attribute_progress ap
    LEFT JOIN seasons s
    ON ap.date >= s.start_date
    AND ap.date <= s.end_date
    WHERE ap.market_value IS NOT NULL
    ORDER BY ap.date ASC
    `).all();

    const marketTransfers = db.prepare(`
    SELECT
    t.date,
    to_club.name AS club_name,
    to_club.logo AS club_logo
    FROM transfers t
    JOIN clubs to_club ON to_club.id = t.to_club_id
    ORDER BY t.date ASC
    `).all();

    const marketValues = marketHistory.map(item => item.market_value);

    const marketSummary = {
        current: marketValues.length ? marketValues[marketValues.length - 1] : null,
        max: marketValues.length ? Math.max(...marketValues) : null
    };

    const campaigns = db.prepare(`
    SELECT
      cc.*,
      s.name AS season_name,
        c.name AS club_name,
        c.logo AS club_logo,
        comp.name AS competition_name,
        comp.logo AS competition_logo,
        comp.category AS competition_category
    FROM competition_campaigns cc
    JOIN seasons s ON s.id = cc.season_id
    JOIN clubs c ON c.id = cc.club_id
    JOIN competitions comp ON comp.id = cc.competition_id
    ORDER BY s.start_date DESC, cc.id DESC
    `).all();

    res.render('player', {
        title: 'Jogador',
        player,
        currentTransfer,
        latestAttributes,
        trophies,
        careerStats,
        careerTotals,
        overallHistory,
        overallSummary,
        marketHistory,
        marketTransfers,
        marketSummary,
        campaigns,
        formatMoney,
        formatDate
    });
});

router.get('/gerenciar', (req, res) => {
    const player = db.prepare('SELECT * FROM players LIMIT 1').get();
    const countries = db.prepare('SELECT * FROM countries ORDER BY name ASC').all();

    res.render('manage-player', {
        title: 'Gerenciar Jogador',
        player,
        countries
    });
});

router.post('/salvar', upload.single('photo'), (req, res) => {
    const {
        name,
        shirt_number,
        sponsor,
        age,
        height,
        weight,
        nationality_id,
        positions,
        skill_moves,
        weak_foot,
        preferred_foot,
        current_photo
    } = req.body;

    const photo = req.file ? `/uploads/players/${req.file.filename}` : current_photo || null;
    const existingPlayer = db.prepare('SELECT * FROM players LIMIT 1').get();

    if (existingPlayer) {
        db.prepare(`
        UPDATE players
        SET name = ?, photo = ?, shirt_number = ?, sponsor = ?, age = ?, height = ?, weight = ?,
        nationality_id = ?, positions = ?, skill_moves = ?, weak_foot = ?, preferred_foot = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `).run(
            name,
            photo,
            shirt_number,
            sponsor,
            age || null,
            height,
            weight,
            nationality_id || null,
            positions,
            skill_moves || null,
            weak_foot || null,
            preferred_foot,
            existingPlayer.id
        );
    } else {
        db.prepare(`
        INSERT INTO players
        (name, photo, shirt_number, sponsor, age, height, weight, nationality_id, positions, skill_moves, weak_foot, preferred_foot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name,
            photo,
            shirt_number,
            sponsor,
            age || null,
            height,
            weight,
            nationality_id || null,
            positions,
            skill_moves || null,
            weak_foot || null,
            preferred_foot
        );
    }

    res.redirect('/jogador');
});

module.exports = router;