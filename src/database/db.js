const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  name TEXT NOT NULL,
  photo TEXT,

  shirt_number TEXT,
  sponsor TEXT,

  age INTEGER,
  height TEXT,
  weight TEXT,

  nationality_id INTEGER,
  positions TEXT,
  preferred_foot TEXT,

  skill_moves INTEGER,
  weak_foot INTEGER,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (nationality_id) REFERENCES countries(id)
  );

  CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Clube',
  logo TEXT,
  country_id INTEGER,
  league_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (league_id) REFERENCES competitions(id)
  );

  CREATE TABLE IF NOT EXISTS competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  country_id INTEGER,
  logo TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id)
  );

  CREATE TABLE IF NOT EXISTS trophies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  name TEXT NOT NULL,
  image TEXT,
  importance INTEGER DEFAULT 1,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trophy_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  trophy_id INTEGER NOT NULL,
  season_id INTEGER,
  club_id INTEGER,
  competition_id INTEGER,
  extra_info TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (trophy_id) REFERENCES trophies(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (competition_id) REFERENCES competitions(id)
  );

  CREATE TABLE IF NOT EXISTS attribute_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  date TEXT NOT NULL,
  age INTEGER,

  overall INTEGER NOT NULL,
  pace INTEGER,
  shooting INTEGER,
  passing INTEGER,
  dribbling INTEGER,
  defending INTEGER,
  physical INTEGER,

  market_value INTEGER,
  salary INTEGER,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS market_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    market_value INTEGER NOT NULL,
    is_transfer_marker INTEGER DEFAULT 0,
    transfer_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transfer_id) REFERENCES transfers(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  season_id INTEGER NOT NULL,
  date TEXT NOT NULL,

  from_club_id INTEGER,
  to_club_id INTEGER NOT NULL,

  market_value INTEGER,
  transfer_fee INTEGER,
  contract_until TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (from_club_id) REFERENCES clubs(id),
  FOREIGN KEY (to_club_id) REFERENCES clubs(id)
  );

  CREATE TABLE IF NOT EXISTS career_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  campaign_id INTEGER NOT NULL UNIQUE,

  games INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,

  yellow_cards INTEGER DEFAULT 0,
  second_yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,

  average_rating REAL,

  top_scorer INTEGER DEFAULT 0,
  top_assister INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (campaign_id)
    REFERENCES competition_campaigns(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS injuries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  season_id INTEGER NOT NULL,
  injury_name TEXT NOT NULL,

  injury_date TEXT,
  days_injured INTEGER DEFAULT 0,
  games_missed INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (season_id) REFERENCES seasons(id)
  );

  CREATE TABLE IF NOT EXISTS competition_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  season_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  competition_id INTEGER NOT NULL,

  final_position TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (competition_id) REFERENCES competitions(id)
  );

  CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  start_date TEXT,
  end_date TEXT,
  is_current INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  flag TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;