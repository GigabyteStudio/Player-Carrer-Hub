const express = require('express');
const db = require('../database/db');
const images = require('../utils/namedImages');
const router = express.Router();
const categories = ['Liga', 'Copa Nacional', 'Copa da Liga', 'Continental', 'Amistoso', 'Seleção'];
const upload = images.stagingUpload('competitions', 'logo');
function render(res, status = 200, error = null) {
  return res.status(status).render('manage-competitions', {
    title: 'Competições', error, categories,
    countries: db.prepare('SELECT * FROM countries ORDER BY name COLLATE NOCASE').all(),
    competitions: db.prepare(`SELECT co.*, c.name AS country_name, c.flag AS country_flag
      FROM competitions co LEFT JOIN countries c ON c.id=co.country_id ORDER BY co.name COLLATE NOCASE`).all()
  });
}
router.get('/', (_req, res) => render(res));
function save(req, res, editing = false) {
  upload(req, res, err => {
    if (err) return render(res, 400, 'Logo inválida. Use JPG, PNG ou WebP com até 5 MB.');
    const name = String(req.body.name || '').trim();
    const category = req.body.category;
    const countryId = req.body.country_id ? Number(req.body.country_id) : null;
    const country = countryId === null ? null : db.prepare('SELECT id FROM countries WHERE id=?').get(countryId);
    const old = editing ? db.prepare('SELECT * FROM competitions WHERE id=?').get(req.params.id) : null;
    if (!name || name.length > 100 || !categories.includes(category) || (countryId !== null && !country) || (editing && !old)) {
      images.discard(req.file);
      return render(res, 400, 'Informe nome e categoria válidos. Se escolher um país, ele deve ser válido.');
    }
    try {
      const logo = images.resolvedUrl('competitions', name, req.file, old?.logo, old?.name);
      images.finalize('competitions', name, req.file);
      if (editing) {
        db.prepare('UPDATE competitions SET name=?,category=?,country_id=?,logo=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .run(name, category, countryId, logo, old.id);
      } else {
        db.prepare('INSERT INTO competitions(name,category,country_id,logo) VALUES(?,?,?,?)')
          .run(name, category, countryId, logo);
      }
      res.redirect('/gerenciar/competicoes');
    } catch (e) {
      console.error(e);
      images.discard(req.file);
      render(res, 500, 'Não foi possível salvar a competição.');
    }
  });
}
router.post('/adicionar', (req, res) => save(req, res));
router.post('/editar/:id', (req, res) => save(req, res, true));
router.post('/excluir/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM competitions WHERE id=?').run(req.params.id);
    // Mantém a imagem no disco para futuros cadastros.
    res.redirect('/gerenciar/competicoes');
  } catch (e) {
    console.error(e);
    render(res, 400, 'Não é possível excluir competição vinculada a outros registros.');
  }
});
module.exports = router;
