const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database/db');

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
        cb(null, 'public/uploads/trophies');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${slugify(req.body.name || 'trofeu')}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
    const trophies = db.prepare(`
    SELECT * FROM trophies
    ORDER BY importance DESC, name ASC
  `).all();

    const entries = db.prepare(`
    SELECT 
      te.*,
      t.name AS trophy_name,
      s.name AS season_name,
      c.name AS club_name,
      comp.name AS competition_name
    FROM trophy_entries te
    JOIN trophies t ON t.id = te.trophy_id
    LEFT JOIN seasons s ON s.id = te.season_id
    LEFT JOIN clubs c ON c.id = te.club_id
    LEFT JOIN competitions comp ON comp.id = te.competition_id
    ORDER BY t.importance DESC, s.start_date DESC
  `).all();

    const seasons = db.prepare(`SELECT * FROM seasons ORDER BY start_date DESC`).all();
    const clubs = db.prepare(`SELECT * FROM clubs ORDER BY name ASC`).all();
    const competitions = db.prepare(`SELECT * FROM competitions ORDER BY name ASC`).all();

    res.render('manage-trophies', {
        title: 'Troféus',
        trophies,
        entries,
        seasons,
        clubs,
        competitions
    });
});

router.post('/adicionar-trofeu', upload.single('image'), (req, res) => {
    const { name, importance } = req.body;
    const image = req.file ? `/uploads/trophies/${req.file.filename}` : null;

    db.prepare(`
    INSERT INTO trophies (name, image, importance)
    VALUES (?, ?, ?)
  `).run(name, image, importance || 1);

    res.redirect('/gerenciar/trofeus');
});

router.post('/adicionar-conquista', (req, res) => {
    const { trophy_id, season_id, club_id, competition_id, extra_info } = req.body;

    db.prepare(`
    INSERT INTO trophy_entries
    (trophy_id, season_id, club_id, competition_id, extra_info)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        trophy_id,
        season_id || null,
        club_id || null,
        competition_id || null,
        extra_info || null
    );

    res.redirect('/gerenciar/trofeus');
});

router.get('/editar-trofeu/:id', (req, res) => {
    const trophy = db.prepare(`SELECT * FROM trophies WHERE id = ?`).get(req.params.id);

    res.render('edit-trophy', {
        title: 'Editar Troféu',
        trophy
    });
});

router.post('/editar-trofeu/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, importance, current_image } = req.body;

    const image = req.file ? `/uploads/trophies/${req.file.filename}` : current_image;

    db.prepare(`
    UPDATE trophies
    SET name = ?, image = ?, importance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, image, importance || 1, id);

    res.redirect('/gerenciar/trofeus');
});

router.get('/editar-conquista/:id', (req, res) => {
    const entry = db.prepare(`SELECT * FROM trophy_entries WHERE id = ?`).get(req.params.id);

    const trophies = db.prepare(`SELECT * FROM trophies ORDER BY importance DESC, name ASC`).all();
    const seasons = db.prepare(`SELECT * FROM seasons ORDER BY start_date DESC`).all();
    const clubs = db.prepare(`SELECT * FROM clubs ORDER BY name ASC`).all();
    const competitions = db.prepare(`SELECT * FROM competitions ORDER BY name ASC`).all();

    res.render('edit-trophy-entry', {
        title: 'Editar Conquista',
        entry,
        trophies,
        seasons,
        clubs,
        competitions
    });
});

router.post('/editar-conquista/:id', (req, res) => {
    const { id } = req.params;
    const { trophy_id, season_id, club_id, competition_id, extra_info } = req.body;

    db.prepare(`
    UPDATE trophy_entries
    SET trophy_id = ?, season_id = ?, club_id = ?, competition_id = ?, extra_info = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
        trophy_id,
        season_id || null,
        club_id || null,
        competition_id || null,
        extra_info || null,
        id
    );

    res.redirect('/gerenciar/trofeus');
});

router.post('/excluir-trofeu/:id', (req, res) => {
    db.prepare(`DELETE FROM trophies WHERE id = ?`).run(req.params.id);
    res.redirect('/gerenciar/trofeus');
});

router.post('/excluir-conquista/:id', (req, res) => {
    db.prepare(`DELETE FROM trophy_entries WHERE id = ?`).run(req.params.id);
    res.redirect('/gerenciar/trofeus');
});

module.exports = router;