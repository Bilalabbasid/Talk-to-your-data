/* db_setup.js
   Creates a realistic banking schema in SQLite and seeds expanded dummy data (transactions, loans, payments).
*/

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

module.exports = async function createAndSeed() {
  const DB_DIR = path.join(__dirname, 'db');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
  const DB_FILE = path.join(DB_DIR, 'banking.db');

  if (fs.existsSync(DB_FILE)) {
    console.log('Removing existing DB for fresh seed...');
    fs.unlinkSync(DB_FILE);
  }

  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  function exec(sql) {
    return db.exec(sql);
  }

  console.log('Creating tables...');

  await exec(`PRAGMA journal_mode = WAL;`);

  await exec(`
CREATE TABLE IF NOT EXISTS customers (
  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  dob DATE,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  branch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_name TEXT,
  branch_code TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  account_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  branch_id INTEGER,
  account_number TEXT UNIQUE,
  account_type TEXT,
  status TEXT,
  balance NUMERIC,
  currency TEXT,
  opened_date DATE,
  closed_date DATE
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER,
  date DATE,
  type TEXT,
  category TEXT,
  merchant TEXT,
  description TEXT,
  amount NUMERIC,
  related_account_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  account_id INTEGER,
  principal_amount NUMERIC,
  interest_rate REAL,
  start_date DATE,
  end_date DATE,
  status TEXT
);

CREATE TABLE IF NOT EXISTS loan_payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER,
  date DATE,
  amount NUMERIC
);

CREATE TABLE IF NOT EXISTS cards (
  card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER,
  card_type TEXT,
  card_number TEXT UNIQUE,
  expiry_date DATE,
  credit_limit NUMERIC,
  status TEXT
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  beneficiary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  account_number TEXT,
  relationship TEXT,
  added_on DATE
);

CREATE TABLE IF NOT EXISTS transfers (
  transfer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account_id INTEGER,
  to_beneficiary_id INTEGER,
  date DATE,
  amount NUMERIC,
  status TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT,
  table_name TEXT,
  row_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

  console.log('Seeding branch, customer, account data...');

  // Insert branches
  await db.run('INSERT INTO branches (branch_name, branch_code, address) VALUES (?, ?, ?)', ['Main Branch', 'MB01', '123 Bank St']);
  await db.run('INSERT INTO branches (branch_name, branch_code, address) VALUES (?, ?, ?)', ['Uptown Branch', 'UB02', '456 High St']);

  // Insert customers
  await db.run('INSERT INTO customers (first_name, last_name, email, phone, dob, address) VALUES (?, ?, ?, ?, ?, ?)', ['Alice', 'Brown', 'alice@example.com', '555-1234', '1985-06-12', '123 Main St']);
  await db.run('INSERT INTO customers (first_name, last_name, email, phone, dob, address) VALUES (?, ?, ?, ?, ?, ?)', ['John', 'Smith', 'john@example.com', '555-5678', '1990-09-20', '789 Oak Ave']);
  await db.run('INSERT INTO customers (first_name, last_name, email, phone, dob, address) VALUES (?, ?, ?, ?, ?, ?)', ['David', 'Lee', 'david@example.com', '555-9012', '1982-01-15', '321 Elm St']);

  // Insert accounts
  await db.run('INSERT INTO accounts (customer_id, branch_id, account_number, account_type, status, balance, currency, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 1, 'AC1001', 'savings', 'active', 5400.00, 'USD', '2023-01-01']);
  await db.run('INSERT INTO accounts (customer_id, branch_id, account_number, account_type, status, balance, currency, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 1, 'AC1002', 'checking', 'active', 2500.50, 'USD', '2023-04-12']);
  await db.run('INSERT INTO accounts (customer_id, branch_id, account_number, account_type, status, balance, currency, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [2, 1, 'AC2001', 'credit', 'active', -1200.75, 'USD', '2023-08-10']);
  await db.run('INSERT INTO accounts (customer_id, branch_id, account_number, account_type, status, balance, currency, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [3, 2, 'AC3001', 'savings', 'active', 3200.00, 'USD', '2024-02-15']);

  // Insert beneficiaries
  await db.run('INSERT INTO beneficiaries (name, account_number, relationship, added_on) VALUES (?, ?, ?, ?)', ['John Smith', '9988223344', 'Friend', '2023-04-01']);
  await db.run('INSERT INTO beneficiaries (name, account_number, relationship, added_on) VALUES (?, ?, ?, ?)', ['Alice Brown', '8899776611', 'Family', '2023-06-12']);
  await db.run('INSERT INTO beneficiaries (name, account_number, relationship, added_on) VALUES (?, ?, ?, ?)', ['David Lee', '7766554433', 'Business', '2024-01-20']);

  // Insert transactions
  const txs = [
    [1, '2024-01-05', 'debit', 'groceries', 'Market', 'Groceries', 95.20, null],
    [1, '2024-01-20', 'debit', 'dining', 'Cafe Latte', 'Lunch with friend', 45.00, null],
    [1, '2024-02-01', 'credit', 'salary', 'ABC Corp', 'Monthly salary', 2500.00, null],
    [2, '2024-02-14', 'debit', 'dining', 'Fancy Restaurant', 'Valentines dinner', 220.00, null],
    [1, '2024-03-03', 'debit', 'groceries', 'Supermarket A', 'Weekly shopping', 130.00, null],
    [2, '2024-03-10', 'debit', 'entertainment', 'Netflix', 'Monthly', 50.00, null],
    [1, '2024-04-11', 'debit', 'utilities', 'Electric Co', 'Electric bill', 180.00, null],
    [2, '2024-04-20', 'debit', 'shopping', 'Mall Store', 'Shoes', 260.00, null],
    [1, '2024-05-05', 'debit', 'rent', 'Landlord', 'Monthly rent', 1200.00, null],
    [1, '2024-06-12', 'debit', 'travel', 'Airline', 'Flight to Lahore', 320.00, null],
    [3, '2024-06-20', 'debit', 'travel', 'Airline', 'Business trip', 650.00, null],
    [1, '2024-07-01', 'credit', 'refund', 'Amazon', 'Refund', 60.00, null],
    [1, '2024-07-15', 'debit', 'shopping', 'Nike Store', 'Clothes', 180.00, null],
    [2, '2024-08-09', 'debit', 'dining', "Domino's", 'Family dinner', 75.00, null],
    [1, '2024-08-22', 'debit', 'groceries', 'Market', 'Monthly groceries', 140.00, null],
    [2, '2024-09-10', 'debit', 'groceries', 'Supermarket A', 'Weekly grocery shopping', 120.00, null],
    [1, '2024-09-12', 'debit', 'dining', 'Kebab House', 'Family lunch', 80.50, null],
    [1, '2024-10-01', 'credit', 'salary', 'ABC Corp', 'Monthly salary', 2500.00, null],
    [1, '2024-10-10', 'debit', 'utilities', 'Electric Co', 'Electric bill', 300.00, null],
    [2, '2024-10-11', 'debit', 'entertainment', 'Netflix', 'Monthly subscription', 50.00, null],
    [2, '2024-11-01', 'debit', 'rent', 'Landlord', 'Monthly rent', 1200.00, null],
    [3, '2024-11-05', 'debit', 'travel', 'Airline', 'Flight to Dubai', 950.00, null],
    [1, '2024-11-12', 'debit', 'shopping', 'Nike Store', 'Shoes purchase', 250.00, null],
    [1, '2024-11-22', 'debit', 'dining', "Domino's", 'Dinner', 75.00, null],
    [1, '2024-12-02', 'debit', 'groceries', 'Supermarket A', 'Grocery refill', 100.00, null],
    [2, '2024-12-05', 'credit', 'refund', 'Amazon', 'Product refund', 60.00, null],
    [3, '2025-01-10', 'debit', 'utilities', 'Water Board', 'Water bill', 45.00, null],
    [1, '2025-02-14', 'debit', 'dining', 'Fancy Restaurant', 'Valentines', 220.00, null],
    [2, '2025-03-03', 'debit', 'groceries', 'Market', 'Monthly groceries', 130.00, null]
  ];

  for (const t of txs) {
    await db.run('INSERT INTO transactions (account_id, date, type, category, merchant, description, amount, related_account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', t);
  }

  console.log('Seeding transactions completed.');

  // Insert transfers sample
  await db.run('INSERT INTO transfers (from_account_id, to_beneficiary_id, date, amount, status, note) VALUES (?, ?, ?, ?, ?, ?)', [2, 1, '2024-09-15', 400.00, 'Completed', 'Rent contribution']);
  await db.run('INSERT INTO transfers (from_account_id, to_beneficiary_id, date, amount, status, note) VALUES (?, ?, ?, ?, ?, ?)', [1, 2, '2024-10-08', 700.00, 'Completed', 'Family support']);
  await db.run('INSERT INTO transfers (from_account_id, to_beneficiary_id, date, amount, status, note) VALUES (?, ?, ?, ?, ?, ?)', [3, 3, '2024-10-30', 950.00, 'Completed', 'Business payment']);
  await db.run('INSERT INTO transfers (from_account_id, to_beneficiary_id, date, amount, status, note) VALUES (?, ?, ?, ?, ?, ?)', [2, 1, '2024-11-05', 1200.00, 'Completed', 'Loan repayment']);

  console.log('Seeding transfers completed.');

  // Insert realistic loans and payment schedules
  await db.run('INSERT INTO loans (customer_id, account_id, principal_amount, interest_rate, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, 1, 5000.00, 7.5, '2024-01-01', '2025-01-01', 'active']);
  const loanId1 = (await db.get('SELECT loan_id FROM loans WHERE customer_id = ? ORDER BY loan_id DESC LIMIT 1', [1])).loan_id;
  const loanPaymentsAlice = [['2024-02-01', 425.00], ['2024-03-01', 425.00], ['2024-04-01', 425.00], ['2024-05-01', 425.00], ['2024-06-01', 425.00], ['2024-07-01', 425.00], ['2024-08-01', 425.00], ['2024-09-01', 425.00], ['2024-10-01', 425.00], ['2024-11-01', 425.00], ['2024-12-01', 425.00]];
  for (const p of loanPaymentsAlice) await db.run('INSERT INTO loan_payments (loan_id, date, amount) VALUES (?, ?, ?)', [loanId1, p[0], p[1]]);

  await db.run('INSERT INTO loans (customer_id, account_id, principal_amount, interest_rate, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, 3, 12000.00, 9.0, '2023-06-01', '2026-06-01', 'active']);
  const loanId2 = (await db.get('SELECT loan_id FROM loans WHERE customer_id = ? ORDER BY loan_id DESC LIMIT 1', [2])).loan_id;
  const loanPaymentsJohn = [['2024-01-15', 350.00], ['2024-02-15', 350.00], ['2024-03-15', 350.00], ['2024-04-15', 350.00], ['2024-05-15', 350.00], ['2024-06-15', 350.00], ['2024-07-15', 350.00], ['2024-08-15', 350.00]];
  for (const p of loanPaymentsJohn) await db.run('INSERT INTO loan_payments (loan_id, date, amount) VALUES (?, ?, ?)', [loanId2, p[0], p[1]]);

  console.log('Inserted loans and loan payments.');

  // Optionally create indexes
  await exec('CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);');
  await exec('CREATE INDEX IF NOT EXISTS idx_tx_acc ON transactions(account_id);');

  console.log('DB ready at', DB_FILE);

  await db.close();
}
