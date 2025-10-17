/* server.js
   Express backend for Talk-to-Your-Data
   - Creates/initializes DB (calls db_setup.js) if missing
   - Exposes endpoints: /schema, /query, /export-pdf
   - Uses placeholder LLM function to translate NL -> SQL (replace with OpenAI or other LLM later)
*/

require('dotenv').config({ path: '../.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbFile = path.join(__dirname, 'db', 'banking.db');
const DB_DIR = path.join(__dirname, 'db');

// Ensure db dir
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

async function initDb() {
  if (!fs.existsSync(dbFile)) {
    console.log('Database not found — running db_setup.js to create and seed DB...');
    // db_setup will create the file
    await require('./db_setup')();
  }

  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  return db;
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Return schema info (tables + columns) so LLM can reason about column names
app.get('/schema', async (req, res) => {
  try {
    const tables = await app.locals.db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const result = {};
    for (const t of tables) {
      const cols = await app.locals.db.all(`PRAGMA table_info(${t.name})`);
      result[t.name] = cols.map(c => ({ name: c.name, type: c.type }));
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple helper to run SQL and return rows
async function runQuery(sql) {
  try {
    const trimmed = sql.trim().toLowerCase();
    if (trimmed.startsWith('select') || trimmed.startsWith('pragma')) {
      const rows = await app.locals.db.all(sql);
      return { rows };
    } else {
      const info = await app.locals.db.run(sql);
      return { info };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// Placeholder NL -> SQL translator
// Replace this with OpenAI or other LLM later. For now, some heuristics + example mappings.
async function nl2sqlPlaceholder(nl, schema) {
  // Very naive mapping for demo. Copilot will replace this with LLM call.
  const q = nl.toLowerCase();

  if (q.includes('biggest transaction') || q.includes('largest transaction')) {
    // last month
    const sql = `SELECT merchant, category, amount, date FROM transactions WHERE date >= date('now','start of month','-1 month') AND date < date('now','start of month') ORDER BY amount DESC LIMIT 1;`;
    return { sql, reason: 'biggest transaction last month' };
  }

  if (q.match(/total money.* to .* last year/) || q.match(/how much.* sent to .* last year/)) {
    // extract name naive
    const m = q.match(/to (.+) in the last year|to (.+) last year|to (.+) in 2024/);
    let name = null;
    if (m) name = m[1] || m[2] || m[3];
    if (name) {
      // search beneficiaries table for that name
      const b = db.prepare("SELECT beneficiary_id FROM beneficiaries WHERE lower(name) LIKE lower('%' || ? || '%')").get(name.trim());
      if (b) {
        const sql = `SELECT SUM(amount) as total_sent FROM transfers WHERE to_beneficiary_id = ${b.beneficiary_id} AND date >= date('now','-1 year');`;
        return { sql, reason: `total money sent to ${name} in last year` };
      }
    }
  }

  // Generic fallback: simple select
  if (q.includes('show all transactions') || q.includes('list all transactions')) {
    const sql = `SELECT * FROM transactions ORDER BY date DESC LIMIT 200;`;
    return { sql, reason: 'list all transactions' };
  }

  // If nothing matched, ask LLM (placeholder shows using OPENAI env)
  return { sql: null, reason: 'needs LLM' };
}

// API: POST /query { query: "natural language question" }
app.post('/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'missing query' });

  try {
    // get schema to help translator
    const schemaTables = await app.locals.db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const schema = {};
    for (const t of schemaTables) {
      const cols = await app.locals.db.all(`PRAGMA table_info(${t.name})`);
      schema[t.name] = cols.map(c => c.name);
    }

    // attempt placeholder translator
    const translation = await nl2sqlPlaceholder(query, schema);

    if (!translation.sql) {
      return res.json({ error: 'Could not generate SQL with placeholder translator. Replace nl2sqlPlaceholder with LLM call (OpenAI or other).', suggestion: 'Use /schema to fetch table/column names for prompt.' });
    }

    const execution = await runQuery(translation.sql);
    // record audit (best-effort)
    try {
      await app.locals.db.run('INSERT INTO audit_logs (event, table_name, row_id) VALUES (?, ?, ?)', [query, 'queries', null]);
    } catch (e) {}

    res.json({ query, sql: translation.sql, reason: translation.reason, result: execution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PDF export endpoint (very small report)
app.post('/export-pdf', (req, res) => {
  const { title = 'Report', data = [] } = req.body;
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  const filename = 'report.pdf';

  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', 'application/pdf');

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();
  data.forEach(row => {
    doc.fontSize(12).text(JSON.stringify(row));
    doc.moveDown(0.2);
  });

  doc.pipe(res);
  doc.end();
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    const db = await initDb();
    app.locals.db = db;
    app.listen(PORT, () => console.log(`✅ Server started on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
