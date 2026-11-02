
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = path.join(__dirname, '..');

const databasePath = path.join(root, 'database', 'database.sqlite');
const uploadsPath = path.join(root, 'public', 'uploads');

const playersPath = path.join(uploadsPath, 'players');
const trophiesPath = path.join(uploadsPath, 'trophies');

const resetAll = process.argv.includes('--all');

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Removido: ${filePath}`);
  }
}

function clearFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return;

  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const currentPath = path.join(folderPath, item);

    if (fs.lstatSync(currentPath).isDirectory()) {
      clearFolder(currentPath);
    } else if (item !== '.gitkeep') {
      fs.unlinkSync(currentPath);
      console.log(`Removido: ${currentPath}`);
    }
  }
}

function clearDatabase() {
  deleteFile(databasePath);
  deleteFile(`${databasePath}-wal`);
  deleteFile(`${databasePath}-shm`);
}

function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function confirmResetAll() {
  if (!process.stdin.isTTY) {
    console.log('Reset total cancelado: terminal interativo necessário.');
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\n===================================');
    console.log('        ATENÇÃO: RESET TOTAL       ');
    console.log('===================================');
    console.log('O banco de dados e TODAS as imagens');
    console.log('serão excluídos permanentemente.\n');

    const first = await askQuestion(
      rl,
      '1/2 - Deseja realmente continuar? (y/n): '
    );

    if (first !== 'y') {
      console.log('\nReset cancelado.');
      return false;
    }

    const second = await askQuestion(
      rl,
      '2/2 - Confirma a exclusão definitiva? (y/n): '
    );

    if (second !== 'y') {
      console.log('\nReset cancelado.');
      return false;
    }

    return true;
  } finally {
    rl.close();
  }
}

async function main() {
  if (resetAll) {
    const confirmed = await confirmResetAll();

    if (!confirmed) return;

    clearDatabase();
    clearFolder(uploadsPath);

    console.log('\nReset total concluído.');
  } else {
    console.log('\nIniciando reset da carreira...');

    clearDatabase();

    // Remove fotos do jogador
    clearFolder(playersPath);

    // Remove imagens dos troféus
    clearFolder(trophiesPath);

    console.log('\nReset da carreira concluído.');
    console.log('Imagens de clubes, competições e países preservadas.');
  }
}

main().catch(error => {
  console.error('Erro durante o reset:', error);
  process.exitCode = 1;
});
