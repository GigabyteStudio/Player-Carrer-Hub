const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXTENSIONS = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
const ALLOWED = new Set(Object.keys(EXTENSIONS));
const CATEGORIES = new Set(['clubs', 'competitions', 'countries']);

function folder(category) {
  if (!CATEGORIES.has(category)) throw new Error('Categoria de imagem inválida.');
  const directory = path.join(__dirname, '../../public/uploads', category);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function slug(name) {
  const value = String(name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!value) throw new Error('Nome inválido para imagem.');
  return value.slice(0, 120).replace(/_+$/g, '');
}

function imageUrl(category, filename) {
  return `/uploads/${category}/${filename}`;
}

function find(category, name) {
  const directory = folder(category);
  const base = slug(name);
  const files = fs.readdirSync(directory)
    .filter(file => EXTENSIONS_LIST.some(ext => file.toLowerCase() === `${base}${ext}`))
    .sort((a, b) => fs.statSync(path.join(directory, b)).mtimeMs - fs.statSync(path.join(directory, a)).mtimeMs);
  return files.length ? imageUrl(category, files[0]) : null;
}
const EXTENSIONS_LIST = ['.png', '.jpg', '.webp'];

function stagingUpload(category, field) {
  const multer = require('multer');
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, folder(category)),
      filename: (_req, file, callback) => callback(null, `.upload-${crypto.randomUUID()}${EXTENSIONS[file.mimetype] || '.tmp'}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => callback(null, ALLOWED.has(file.mimetype))
  }).single(field);
}

function discard(uploadedFile) {
  if (uploadedFile?.path) fs.rmSync(uploadedFile.path, { force: true });
}

// Retorna o destino sem tocar nos arquivos; a decisão pode ser gravada no banco primeiro.
function resolvedUrl(category, name, file, previousUrl = null, previousName = null) {
  if (file) return imageUrl(category, `${slug(name)}${EXTENSIONS[file.mimetype]}`);
  return find(category, name) || (previousName === name ? previousUrl : null);
}

function finalize(category, name, file) {
  if (!file) return;
  const destination = path.join(folder(category), `${slug(name)}${EXTENSIONS[file.mimetype]}`);
  if (file.path === destination) return;
  // A imagem nova é gravada no nome padronizado; não excluímos variantes antigas,
  // pois podem estar referenciadas em um banco anterior ou em outro cadastro.
  fs.copyFileSync(file.path, destination);
  discard(file);
}

module.exports = { slug, folder, find, stagingUpload, discard, resolvedUrl, finalize, imageUrl, EXTENSIONS };
