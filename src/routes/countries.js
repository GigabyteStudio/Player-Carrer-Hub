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
        cb(null, 'public/uploads/countries');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${slugify(req.body.name)}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
    const countries = db.prepare(`
    SELECT * FROM countries
    ORDER BY name ASC
  `).all();

    res.render('manage-countries', {
        title: 'Países',
        countries
    });
});

router.post('/adicionar', upload.single('flag'), (req, res) => {
    const { name } = req.body;
    const flag = req.file ? `/uploads/countries/${req.file.filename}` : null;

    db.prepare(`
    INSERT INTO countries (name, flag)
    VALUES (?, ?)
  `).run(name, flag);

    res.redirect('/gerenciar/paises');
});

router.get('/editar/:id', (req, res) => {
    const country = db.prepare(`
    SELECT * FROM countries WHERE id = ?
  `).get(req.params.id);

    res.render('edit-country', {
        title: 'Editar País',
        country
    });
});

router.post('/editar/:id', upload.single('flag'), (req, res) => {
    const { id } = req.params;
    const { name, current_flag } = req.body;

    const flag = req.file ? `/uploads/countries/${req.file.filename}` : current_flag;

    db.prepare(`
    UPDATE countries
    SET name = ?, flag = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, flag, id);

    res.redirect('/gerenciar/paises');
});

router.post('/excluir/:id', (req, res) => {
    db.prepare(`DELETE FROM countries WHERE id = ?`).run(req.params.id);
    res.redirect('/gerenciar/paises');
});

module.exports = router;