const fs = require("fs-extra");
const path = require("path");

const root = path.join(__dirname, "..");

const backupRoot = path.join(root, "backup");
const uploads = path.join(root, "public", "uploads");
const database = path.join(root, "database");

async function createBackup() {
    await fs.ensureDir(backupRoot);

    const folders = await fs.readdir(backupRoot);

    const backups = folders
        .filter(name => /^Backup \d{3}$/.test(name))
        .map(name => Number(name.replace("Backup ", "")));

    const next = backups.length ? Math.max(...backups) + 1 : 1;

    const backupName = `Backup ${String(next).padStart(3, "0")}`;
    const destination = path.join(backupRoot, backupName);

    await fs.ensureDir(destination);

    if (await fs.pathExists(uploads)) {
        await fs.copy(uploads, path.join(destination, "uploads"));
    }

    if (await fs.pathExists(database)) {
        await fs.copy(database, path.join(destination, "database"));
    }

    console.log(`${backupName} criado com sucesso.`);
}

createBackup().catch(console.error);