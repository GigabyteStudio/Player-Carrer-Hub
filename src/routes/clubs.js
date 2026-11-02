const express = require('express');
const db = require('../database/db');
const images = require('../utils/namedImages');
const router = express.Router();
const upload = images.stagingUpload('clubs', 'logo');

function listClubs() {
  return db.prepare(`SELECT cl.*, co.name AS country_name, co.flag AS country_flag
    FROM clubs cl LEFT JOIN countries co ON co.id = cl.country_id
    ORDER BY cl.name COLLATE NOCASE, cl.id`).all();
}
function render(res, status = 200, error = null) {
  return res.status(status).render('manage-clubs', {
    title: 'Clubes', error, clubs: listClubs(),
    countries: db.prepare('SELECT id, name, flag FROM countries ORDER BY name COLLATE NOCASE').all()
  });
}
router.get('/', (_req, res) => render(res));
function save(req, res, editing = false) {
  upload(req, res, error => {
    if (error) return render(res, 400, 'Escudo inválido. Use JPG, PNG ou WebP com até 5 MB.');
    const name = String(req.body.name || '').trim();
    const type = req.body.type;
    const countryId = Number(req.body.country_id);
    const country = Number.isSafeInteger(countryId) ? db.prepare('SELECT id FROM countries WHERE id = ?').get(countryId) : null;
    const old = editing ? db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id) : null;
    if (!name || name.length > 100 || !['Clube', 'Seleção Nacional'].includes(type) || !country || (editing && !old)) {
      images.discard(req.file);
      return render(res, 400, 'Informe um nome, um tipo e um país válidos.');
    }
    const duplicate = db.prepare(`SELECT id FROM clubs WHERE LOWER(name) = LOWER(?) AND country_id = ? AND type = ? AND id != ?`)
      .get(name, countryId, type, old?.id || 0);
    if (duplicate) {
      images.discard(req.file);
      return render(res, 400, 'Já existe uma equipe com esse nome, país e tipo.');
    }
    try {
      const logo = images.resolvedUrl('clubs', name, req.file, old?.logo, old?.name);
      // O arquivo é finalizado antes da atualização; se houver falha no SQLite,
      // a imagem continua disponível para reutilização.
      images.finalize('clubs', name, req.file);
      if (editing) {
        db.prepare(`UPDATE clubs SET name=?, type=?, country_id=?, league_id=NULL, logo=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
          .run(name, type, countryId, logo, old.id);
      } else {
        db.prepare(`INSERT INTO clubs(name,type,country_id,league_id,logo) VALUES(?,?,?,NULL,?)`)
          .run(name, type, countryId, logo);
      }
      res.redirect('/gerenciar/clubes');
    } catch (e) {
      console.error(e);
      images.discard(req.file);
      return render(res, 500, 'Não foi possível salvar a equipe.');
    }
  });
}
router.post('/adicionar', (req, res) => save(req, res));
router.post('/editar/:id', (req, res) => save(req, res, true));
router.post('/excluir/:id', (req, res) => {
  const club = db.prepare('SELECT id FROM clubs WHERE id=?').get(req.params.id);
  if (!club) return render(res, 404, 'Equipe não encontrada.');
  try {
    db.prepare('DELETE FROM clubs WHERE id=?').run(club.id);
    // Não apagar escudo: poderá ser reutilizado em outro cadastro ou após reset.
    res.redirect('/gerenciar/clubes');
  } catch (e) {
    console.error(e);
    render(res, 400, 'Não foi possível excluir: equipe vinculada a outros registros.');
  }
});
module.exports = router;
