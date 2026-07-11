const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
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
        cb(null, 'public/uploads/competitions');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${slugify(req.body.name)}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
    const competitions = db.prepare(`
    SELECT 
      competitions.*,
      countries.name AS country_name,
      countries.flag AS country_flag
    FROM competitions
    LEFT JOIN countries ON countries.id = competitions.country_id
    ORDER BY competitions.name ASC
  `).all();

    const countries = db.prepare(`
    SELECT * FROM countries
    ORDER BY name ASC
  `).all();

    res.render('manage-competitions', {
        title: 'Competições',
        competitions,
        countries,
        formatDate
    });
});

router.post('/adicionar', upload.single('logo'), (req, res) => {
    const { name, category, country_id } = req.body;
    const logo = req.file ? `/uploads/competitions/${req.file.filename}` : null;

    db.prepare(`
    INSERT INTO competitions (name, category, country_id, logo)
    VALUES (?, ?, ?, ?)
  `).run(name, category, country_id || null, logo);

    res.redirect('/gerenciar/competicoes');
});

router.get('/editar/:id', (req, res) => {
    const competition = db.prepare(`
    SELECT * FROM competitions WHERE id = ?
  `).get(req.params.id);

    const countries = db.prepare(`
    SELECT * FROM countries
    ORDER BY name ASC
  `).all();

    res.render('edit-competition', {
        title: 'Editar Competição',
        competition,
        countries
    });
});

router.post('/editar/:id', upload.single('logo'), (req, res) => {
    const { id } = req.params;
    const { name, category, country_id, current_logo } = req.body;

    const logo = req.file ? `/uploads/competitions/${req.file.filename}` : current_logo;

    db.prepare(`
    UPDATE competitions
    SET name = ?, category = ?, country_id = ?, logo = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category, country_id || null, logo, id);

    res.redirect('/gerenciar/competicoes');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare('DELETE FROM competitions WHERE id = ?').run(req.params.id);
    res.redirect('/gerenciar/competicoes');
});

module.exports = router;