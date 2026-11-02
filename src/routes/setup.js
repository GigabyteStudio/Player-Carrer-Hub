const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../database/db');
const positions = require('../data/positions');
const countries = require('../data/countries.json');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '../../public/uploads/players');
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => cb(null, `jogador-${crypto.randomUUID()}.${({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.mimetype] || 'bin'}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('A foto deve ser JPG, PNG ou WebP.'));
    }
    cb(null, true);
  }
}).single('photo');

function getPlayer() { return db.prepare('SELECT * FROM players ORDER BY id LIMIT 1').get(); }
function renderForm(req, res, error = null, values = null) {
  const player = getPlayer();
  res.status(error ? 400 : 200).render('setup', {
    title: player ? 'Editar jogador' : 'Cadastrar jogador',
    player, positions, countries: countries.map(c => ({...c, name: new Intl.DisplayNames(['pt-BR'], {type: 'region'}).of(c.code)})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')), error,
    values: values || player || {},
    nationalityCode: values?.nationality_code || (player?.nationality_id ? (countries.find(c => new Intl.DisplayNames(['pt-BR'], {type:'region'}).of(c.code) === db.prepare('SELECT name FROM countries WHERE id=?').get(player.nationality_id)?.name)?.code || '') : '')
  });
}

router.get('/', (req, res) => renderForm(req, res));
router.post('/', (req, res) => {
  upload(req, res, err => {
    if (err) return renderForm(req, res, err.message, req.body);
    const data = req.body;
    const pos = Array.isArray(data.positions) ? data.positions : (data.positions ? [data.positions] : []);
    const cleanPositions = [...new Set(pos)];
    const country = countries.find(c => c.code === data.nationality_code);
    const integer = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
    const height = Number(data.height), weight = Number(data.weight);
    let error = null;
    if (!data.name?.trim() || data.name.trim().length > 90) error = 'Informe o nome do jogador (até 90 caracteres).';
    else if (!integer(data.age, 15, 65)) error = 'Informe uma idade entre 15 e 65 anos.';
    else if (!Number.isFinite(height) || height < 120 || height > 230) error = 'Informe a altura em centímetros (120 a 230).';
    else if (!Number.isFinite(weight) || weight < 35 || weight > 200) error = 'Informe o peso em quilogramas (35 a 200).';
    else if (!cleanPositions.length || cleanPositions.length > 5 || cleanPositions.some(v => !positions.includes(v)) || (cleanPositions.includes('GOL') && cleanPositions.length !== 1)) error = 'Selecione de 1 a 5 posições. Goleiro deve ser a única posição.';
    else if (!country) error = 'Selecione uma nacionalidade.';
    else if (!['Direito', 'Esquerdo'].includes(data.preferred_foot)) error = 'Selecione o pé dominante.';
    else if (data.shirt_number && !integer(data.shirt_number, 1, 99)) error = 'O número da camisa deve estar entre 1 e 99.';
    else if (!integer(data.skill_moves ?? 0, 0, 5) || !integer(data.weak_foot ?? 0, 0, 5)) error = 'Fintas e Perna Ruim devem estar entre 0 e 5 estrelas.';
    if (error) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      return renderForm(req, res, error, data);
    }
    try {
      const existing = getPlayer();
      const nationalName = new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(country.code);
      db.prepare('INSERT OR IGNORE INTO countries (name) VALUES (?)').run(nationalName);
      const nationalityId = db.prepare('SELECT id FROM countries WHERE name = ?').get(nationalName).id;
      const photo = req.file ? '/uploads/players/' + req.file.filename : (existing?.photo || null);
      const x = Math.min(100, Math.max(0, Number(data.photo_position_x) || 50));
      const y = Math.min(100, Math.max(0, Number(data.photo_position_y) || 50));
      const zoom = Math.min(2, Math.max(1, Number(data.photo_zoom) || 1));
      const values = [data.name.trim(), photo, data.shirt_number || null, data.sponsor?.trim().slice(0,100) || null, Number(data.age), String(height), String(weight), nationalityId, cleanPositions.join(', '), data.preferred_foot, x, y, zoom, Number(data.skill_moves ?? 0), Number(data.weak_foot ?? 0)];
      if (existing) {
        db.prepare(`UPDATE players SET name=?,photo=?,shirt_number=?,sponsor=?,age=?,height=?,weight=?,nationality_id=?,positions=?,preferred_foot=?,photo_position_x=?,photo_position_y=?,photo_zoom=?,skill_moves=?,weak_foot=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...values, existing.id);
      } else {
        db.prepare(`INSERT INTO players (name,photo,shirt_number,sponsor,age,height,weight,nationality_id,positions,preferred_foot,photo_position_x,photo_position_y,photo_zoom,skill_moves,weak_foot) VALUES (${Array(15).fill('?').join(',')})`).run(...values);
      }
      if (req.file && existing?.photo?.startsWith('/uploads/players/')) {
        const old = path.join(uploadDirectory, path.basename(existing.photo));
        if (old !== req.file.path) fs.rmSync(old, { force: true });
      }
      return res.redirect('/jogador');
    } catch (e) {
      if (req.file) fs.rmSync(req.file.path, { force: true });
      console.error(e);
      return renderForm(req, res, 'Não foi possível salvar o jogador. Verifique os dados e tente novamente.', data);
    }
  });
});
module.exports = router;
