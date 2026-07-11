const fs = require('fs');
const path = require('path');

const databasePath = path.join(__dirname, '../database/database.sqlite');
const uploadsPath = path.join(__dirname, '../public/uploads');

function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Removido: ${filePath}`);
    }
}

function clearFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;

    fs.readdirSync(folderPath).forEach(file => {
        const currentPath = path.join(folderPath, file);

        if (fs.lstatSync(currentPath).isDirectory()) {
            clearFolder(currentPath);
            return;
        }

        if (file === '.gitkeep') {
            console.log(`Mantido: ${currentPath}`);
            return;
        }

        fs.unlinkSync(currentPath);
        console.log(`Removido: ${currentPath}`);
    });
}

deleteFile(databasePath);
clearFolder(uploadsPath);

console.log('Reset concluído.');