# Talk to Your Data

Full-stack demo to convert Natural Language queries into SQL and return friendly results using an SQLite database seeded with realistic banking tables.

## Project Structure

```
talk-to-your-data/
├─ server/              # Backend (Express + SQLite)
│  ├─ server.js
│  ├─ db_setup.js
│  ├─ package.json
│  └─ db/              # SQLite database (created on first run)
├─ client/             # Frontend (React + Vite)
│  ├─ src/
│  ├─ package.json
│  └─ vite.config.js
└─ package.json        # Root package for concurrent dev scripts
```

## Quick Start

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Run development mode (from root):**
   ```bash
   npm run dev
   ```

   This starts both the Express backend (port 4000) and Vite frontend (port 5173) concurrently.

5. **Open your browser:**
   Navigate to http://localhost:5173

## Features
- � Complex queries: transactions, loans, payments, transfers

## What to Replace for Production
The app includes these tables:
- `customers` - Customer information
- `accounts` - Bank accounts

   # Talk to Your Data

   This repository contains a full-stack demo application that converts plain English questions into SQL, runs them against a local SQLite database, and returns friendly, human-readable results. It includes a React + Vite frontend and an Express backend with a seeded banking dataset.

   This updated README is written for a non-technical partner and includes explicit steps to:
   - Run the app locally on Windows (PowerShell)
   - Understand where the SQLite DB lives and how to inspect it
   - Hook an LLM (like OpenAI) into the server's translation step
   - Push the project to GitHub

   If you're technical, the code is in `server/` and `client/`.

   ---

   ## Table of contents

   - Getting started (quick, copy-paste)
   - How the app is structured (non-technical)
   - Running locally (step-by-step for Windows)
   - How the database works and where it lives
   - How to connect an LLM (OpenAI) — step-by-step for a non-coder
   - Pushing to GitHub (one-shot guide)
   - Troubleshooting & FAQs

   ---

   ## Getting started (quick)

   Open PowerShell and run these commands (copy-paste each line):

   ```powershell
   # 1) Clone the repo (if not already on your PC)
   git clone https://github.com/Bilalabbasid/Talk-to-your-data.git
   cd 'Talk to Your data'

   # 2) Install root, server and client dependencies
   npm install
   cd server; npm install; cd ..
   cd client; npm install; cd ..

   # 3) Start the app (runs both server and client)
   npm run dev
   ```

   After a short while you should see the frontend ready at: http://localhost:5173 and the backend on http://localhost:4000

   ---

   ## How the app is structured (plain English)

   - `server/` — The backend. It runs a small web server (Express). It creates a local SQLite database file at `server/db/banking.db` the first time it runs and seeds it with example banking data (customers, accounts, transactions, loans, etc.).
   - `client/` — The frontend. A React single-page app that talks to the backend at `/query` and `/schema` to ask questions and show results.
   - `.env` — A file where small settings live. Add your OpenAI key here later as `OPENAI_API_KEY=sk-...`.

   ---

   ## Where the SQLite DB lives & how to open it

   - The database file (after you run the app) will be at `server/db/banking.db`.
   - To inspect it visually, you can use any SQLite viewer: DB Browser for SQLite (https://sqlitebrowser.org/) is recommended and free.

   Steps to inspect:

   1. Close the app if it's running (stop the PowerShell terminal).
   2. Open DB Browser for SQLite.
   3. Choose File → Open Database and select `server/db/banking.db` from the project folder.
   4. Browse tables like `transactions`, `accounts`, and `loans`.

   This is safe: the demo DB contains only example data.

   ---

   ## How the NL → SQL flow works (and where to attach an LLM)

   Where: The server file `server/server.js` contains a function named `nl2sqlPlaceholder`. It is a very small placeholder that handles a couple of example phrases. To connect a real LLM you will replace the placeholder with a call to the LLM.

   Non-technical step-by-step to connect OpenAI (recommended):

   1. Create an OpenAI account and get an API key (starts with `sk-...`).
   2. Put the key into the `.env` file in the project root like:

   ```
   OPENAI_API_KEY=sk-XXX_REPLACE_ME_XXX
   PORT=4000
   ```

   3. We'll add a small code change in `server/server.js` (done for you, or your partner can copy/paste):

   - Locate `nl2sqlPlaceholder` in `server/server.js`.
   - Replace its body with a call to OpenAI's Chat Completions (or use the official OpenAI SDK). The server code already contains comments showing where to place this call.

   4. Conceptually, you'll build a prompt that includes the schema and a few examples, for instance:

   ```
   Prompt:
   You are a SQL generator. Here are the database tables: <schema>.
   Convert the user's natural language question into one safe SELECT query only.
   Examples:
   User: "What was my biggest transaction last month?"
   SQL: SELECT ...

   User: "<actual question>"
   SQL:
   ```

   5. The server will call OpenAI with that prompt and receive SQL text. The server then executes that SQL against the local SQLite database and returns the rows to the frontend.

   Security note (important): Do not allow arbitrary destructive SQL (DELETE/UPDATE/INSERT) from the LLM in production — validate the query and only allow SELECT/PRAGMA queries when using this approach.

   ---

   ## Step-by-step: Add OpenAI into this project (non-coder friendly)

   I will outline the minimal change steps. If you want, I can apply these edits directly.

   1) Install OpenAI SDK in the server folder (run in PowerShell):

   ```powershell
   cd server
   npm install openai
   cd ..
   ```

   2) Edit `server/server.js` and replace the `nl2sqlPlaceholder` function with the snippet below (you can ask me to apply it):

   ```js
   const { OpenAI } = require('openai');
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   async function nl2sqlPlaceholder(nl, schema) {
      const prompt = `You are an assistant that converts natural language into a single safe SQLite SELECT query. Tables: ${JSON.stringify(schema)}. User question: ${nl}`;
      const res = await openai.chat.completions.create({
         model: 'gpt-4o-mini',
         messages: [{ role: 'system', content: 'You generate a single SELECT query.' }, { role: 'user', content: prompt }],
         max_tokens: 512
      });
      const sql = res.choices?.[0]?.message?.content?.trim();
      return { sql, reason: 'via OpenAI' };
   }
   ```

   3) Restart the server and try typing a natural-language question in the frontend.

   If you'd like, I can add this OpenAI wiring directly and make it toggleable (only runs when `OPENAI_API_KEY` is present), so your partner can enable it by adding the key to `.env`.

   ---

   ## Pushing to GitHub (simple guide)

   If you already have a repo at https://github.com/Bilalabbasid/Talk-to-your-data, here's how to push your local changes to that remote. Run these commands in PowerShell from the project root:

   ```powershell
   git init
   git add .
   git commit -m "Initial project scaffold: talk-to-your-data"
   # Talk to Your Data

   Full-stack demo to convert Natural Language queries into SQL and return friendly results using an SQLite database seeded with realistic banking tables.

   ## Project Structure

   ```
   talk-to-your-data/
   ├─ server/              # Backend (Express + SQLite)
   │  ├─ server.js
      ├─ db_setup.js
      ├─ package.json
      └─ db/              # SQLite database (created on first run)
   ├─ client/             # Frontend (React + Vite)
   │  ├─ src/
      ├─ package.json
      └─ vite.config.js
   └─ package.json        # Root package for concurrent dev scripts
   ```

   ## Quick Start

   1. **Install root dependencies:**
       ```powershell
       npm install
       ```

   2. **Install server dependencies:**
       ```powershell
       cd server
       npm install
       cd ..
       ```

   3. **Install client dependencies:**
       ```powershell
       cd client
       npm install
       cd ..
       ```

   4. **Run development mode (from root):**
       ```powershell
       npm run dev
       ```

       This starts both the Express backend (port 4000) and Vite frontend (port 5173) concurrently.

   5. **Open your browser:**
       Navigate to http://localhost:5173

   ---

   ## LLM integration status

   - Current state: The server contains a small placeholder translator `nl2sqlPlaceholder` that only handles a few hard-coded phrases. The app will work as a chat-like UI without an LLM, but it cannot translate arbitrary natural language into SQL yet.
   - To enable LLM-based NL→SQL translation you must add an OpenAI (or other LLM) key and wire the SDK into `server/server.js`. The README below includes a paste-ready function and short steps.

   ---

   ## How the app is structured (plain English)

   - `server/` — The backend. It runs an Express server, creates a local SQLite DB at `server/db/banking.db` on first run, and exposes endpoints like `/schema`, `/query`, `/export-pdf`.
   - `client/` — The frontend (React + Vite). It sends queries to `/query` and displays results.
   - `.env` — Add `OPENAI_API_KEY=sk-...` here to enable LLM functionality.

   ---

   ## Where the SQLite DB lives & how to open it

   - The database file (after you run the app) will be at `server/db/banking.db`.
   - To inspect it visually, use DB Browser for SQLite: https://sqlitebrowser.org/

   Steps to inspect:

   1. Close the app if it's running.
   2. Open DB Browser for SQLite.
   3. File → Open Database → select `server/db/banking.db`.
   4. Browse tables like `transactions`, `accounts`, and `loans`.

   ---

   ## How the NL → SQL flow works (and where to attach an LLM)

   - The server function `nl2sqlPlaceholder` is the translation layer. Replace it with an LLM call to produce SQL from arbitrary natural language.

   Quick paste-ready LLM function (OpenAI) — drop into `server/server.js` after installing `openai` in `server/`:

   ```js
   // Requires `npm install openai` inside server/
   const { OpenAI } = require('openai');
   const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

   function sanitizeSqlCandidate(raw) {
      if (!raw) return null;
      let sql = raw.replace(/`/g, '').trim();
      if (sql.includes(';')) sql = sql.split(';')[0];
      const forbidden = /\b(drop|delete|update|insert|alter|create|attach|detach|replace)\b/i;
      if (forbidden.test(sql)) return null;
      if (!/^\s*(select|pragma)/i.test(sql)) return null;
      if (!/limit\s+\d+/i.test(sql)) sql = sql.replace(/;?$/, '') + ' LIMIT 100';
      return sql;
   }

   async function nl2sqlPlaceholder(nl, schema) {
      if (!openai) return { sql: null, reason: 'OPENAI_API_KEY not set' };
      const schemaHint = Object.entries(schema).map(([t, cols]) => `${t}(${cols.join(',')})`).join(' | ');
      const messages = [
         { role: 'system', content: 'You are a SQL generator that outputs a single SQLite SELECT or PRAGMA statement only. Do not output any explanation.' },
         { role: 'user', content: `Schema: ${schemaHint}\n\nConvert the following user request into a single valid SQLite SELECT (or PRAGMA) statement. Add LIMIT 100 if appropriate.\n\nUser: ${nl}` }
      ];

      try {
         const resp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 512,
            temperature: 0
         });

         const candidate = resp.choices?.[0]?.message?.content?.trim();
         const sql = sanitizeSqlCandidate(candidate);
         if (!sql) return { sql: null, reason: 'LLM produced unsafe or invalid SQL' };
         return { sql, reason: 'via OpenAI' };
      } catch (err) {
         return { sql: null, reason: 'LLM error: ' + err.message };
      }
   }
   ```

   **Security note:** Always inspect and validate LLM-generated SQL before trusting it. In production, restrict to SELECT-only and implement authentication and per-user data isolation.

   ---

   ## Step-by-step: Add OpenAI (for AI engineers)

   1. Add key to `.env` in project root:
   ```
   OPENAI_API_KEY=sk-REPLACE_ME
   PORT=4000
   ```
   2. Install SDK in server:
   ```powershell
   cd server
   npm install openai
   cd ..
   ```
   3. Paste the function above into `server/server.js` (or ask me to apply it).
   4. Restart server and test from the front-end.

   ---

   ## Pushing to GitHub (simple guide)

   If you already have a remote, push with:

   ```powershell
   git add .
   git commit -m "Update README: add LLM instructions"
   git push
   ```

   ---

   ## Troubleshooting & FAQs

   - If `npm install` fails due to native modules, the project uses `sqlite`/`sqlite3` so it should avoid native build problems.
   - If the frontend doesn't load, check Vite logs for "Local: http://localhost:5173".
   - If server errors, read the console logs. Common issues: locked DB file, missing env vars, or missing `openai` package when trying to use LLM.

   ---

   ## Schema (high level)

   Tables included: `customers`, `branches`, `accounts`, `transactions`, `loans`, `loan_payments`, `cards`, `beneficiaries`, `transfers`, `audit_logs`.

   ---

   ## Example Queries

   - "What was my biggest transaction last month?"
   - "Show all transactions"
   - "How much did I send to John last year?"
   - "List my recent groceries purchases"
