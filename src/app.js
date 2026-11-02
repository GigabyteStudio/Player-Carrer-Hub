const express = require('express');
const path = require('path');
const db = require('./database/db');

// Coletar rotas

const manageRoutes = require('./routes/manage');
const clubRoutes = require('./routes/clubs');
const seasonRoutes = require('./routes/seasons');
const playerRoutes = require('./routes/player');
const competitionRoutes = require('./routes/competitions');
const campaignRoutes = require('./routes/campaigns');
const countryRoutes = require('./routes/countries');
const statsRoutes = require('./routes/stats');
const evolutionRoutes = require('./routes/evolution');
const transferRoutes = require('./routes/transfers');
const publicTransferRoutes = require('./routes/publicTransfers');
const injuryRoutes = require('./routes/injuries');
const publicInjuryRoutes = require('./routes/publicInjuries');
const trophyRoutes = require('./routes/trophies');
const publicTrophyRoutes = require('./routes/publicTrophies');
const publicStatsRoutes = require('./routes/publicStats');
const publicEvolutionRoutes = require('./routes/publicEvolution');
const notesRoutes = require('./routes/notes');
const setupRoutes = require('./routes/setup');
const recordsRoutes = require('./routes/records');

//

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/cadastro', setupRoutes);

// Exige um jogador cadastrado antes das páginas da carreira.
app.use((req, res, next) => {
    const player = db.prepare('SELECT id FROM players LIMIT 1').get();
    if (!player) return res.redirect('/cadastro');
    next();
});

app.get('/', (req, res) => {
    res.redirect('/jogador');
});

// Seções de View

app.use('/jogador', playerRoutes);
app.use('/transferencias', publicTransferRoutes);
app.use('/lesoes', publicInjuryRoutes);
app.use('/trofeus', publicTrophyRoutes);
app.use('/estatisticas', publicStatsRoutes);
app.use('/evolucao', publicEvolutionRoutes);
app.use('/anotacoes', notesRoutes);
app.use('/registrar', recordsRoutes);

// Seção Gerenciar

app.use('/gerenciar', manageRoutes);
app.use('/gerenciar/clubes', clubRoutes);
app.use('/gerenciar/temporadas', seasonRoutes);
app.use('/gerenciar/competicoes', competitionRoutes);
app.use('/gerenciar/campeonatos', campaignRoutes);
app.use('/gerenciar/paises', countryRoutes);
app.use('/gerenciar/estatisticas', statsRoutes);
app.use('/gerenciar/evolucao', evolutionRoutes);
app.use('/gerenciar/transferencias', transferRoutes);
app.use('/gerenciar/lesoes', injuryRoutes);
app.use('/gerenciar/trofeus', trophyRoutes);

//

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});