const { Pool } = require('pg');

// Prefer a single DATABASE_URL (works well with Supabase/Railway/Render). Fallbacks supported.
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const hasConnection = !!connectionString;
if (!hasConnection) {
  console.warn('DATABASE_URL/SUPABASE_DB_URL is not set. Please configure your Supabase Postgres connection string.');
}

// Create a Postgres pool only when we have a connection string.
// Add keepAlive and sane timeouts to reduce read ECONNRESET on some hosts.
const pool = hasConnection
  ? new Pool({
      connectionString,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
      keepAlive: true,
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 10000),
    })
  : null;

// Surface unexpected pool errors (helps diagnose resets)
if (pool) {
  pool.on('error', (err) => {
    console.error('Postgres pool error:', err.message);
  });
}

// Convert MySQL-style '?' placeholders to Postgres-style $1, $2, ...
function mapPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// A small wrapper to mimic mysql2/promise API: return [rows] and support .execute()
const missingConnError = () => new Error('DATABASE_URL is not set. Set it in backend/.env or Render env and restart the server.');

const db = hasConnection
  ? {
      async query(sql, params = []) {
        const text = mapPlaceholders(sql);
        const result = await pool.query(text, params);
        return [result.rows, null];
      },
      async execute(sql, params = []) {
        return db.query(sql, params);
      }
    }
  : {
      async query() {
        throw missingConnError();
      },
      async execute() {
        throw missingConnError();
      }
    };

// Helper to run table creation sequentially with proper error handling (Postgres syntax)
async function initSchema() {
  const statements = [
    // Users table (since other tables reference it)
    `CREATE TABLE IF NOT EXISTS users (
      userid SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      firstname VARCHAR(100) NOT NULL,
      lastname VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      profilePicture TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      questionid VARCHAR(36) NOT NULL UNIQUE,
      userid INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      tag VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS answers (
      answerid SERIAL PRIMARY KEY,
      userid INT NOT NULL,
      questionid VARCHAR(36) NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
      FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS answer_votes (
      vote_id SERIAL PRIMARY KEY,
      answer_id INT NOT NULL,
      user_id INT NOT NULL,
      vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like','dislike')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answer_id) REFERENCES answers(answerid) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
      UNIQUE (answer_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS replies (
      replyid SERIAL PRIMARY KEY,
      answerid INT NOT NULL,
      userid INT NOT NULL,
      reply_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS reply_votes (
      vote_id SERIAL PRIMARY KEY,
      reply_id INT NOT NULL,
      user_id INT NOT NULL,
      vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like','dislike')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reply_id) REFERENCES replies(replyid) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
      UNIQUE (reply_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS images (
      imageid SERIAL PRIMARY KEY,
      userid INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      originalname VARCHAR(255) NOT NULL,
      mimetype VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      url VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      notification_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      sender_id INT,
      type VARCHAR(20) NOT NULL CHECK (type IN ('answer','comment','upvote','mention','system')),
      content TEXT NOT NULL,
      reference_id VARCHAR(36),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(userid) ON DELETE SET NULL
    )`
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch (err) {
      console.error('Schema init error for statement:', sql.split('\n')[0], '\n', err.message);
      throw err;
    }
  }
}

// Expose a readiness promise with retries so the app can await DB+schema safely
async function wait(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function ensureReadyWithRetry(maxAttempts = Number(process.env.DB_MAX_RETRIES || 5)) {
  if (!hasConnection) throw new Error('DATABASE_URL is not set');

  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      await db.execute('select 1');
      await initSchema();
      console.log('Database schema ensured');
      return; // ready
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(2000 * attempt, 8000);
      console.warn(`DB not ready (attempt ${attempt}/${maxAttempts}): ${err.message}. Retrying in ${backoff}ms...`);
      await wait(backoff);
    }
  }
  console.error('Database schema initialization failed:', lastErr?.message || lastErr);
  throw lastErr;
}

const ready = hasConnection ? ensureReadyWithRetry() : Promise.resolve();

module.exports = {
  ...db,
  pool,
  ready,
};