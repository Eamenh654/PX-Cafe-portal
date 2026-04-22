const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const db = new Database(path.join(dbDir, 'maison.db'));

// One-time initialization of all tables with all current columns
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    icon TEXT,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    name TEXT,
    type TEXT DEFAULT 'choice',
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS variant_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER,
    name TEXT,
    is_default INTEGER DEFAULT 0,
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_cleared INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    special_instructions TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS order_item_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER,
    variant_name TEXT,
    option_name TEXT,
    FOREIGN KEY(order_item_id) REFERENCES order_items(id)
  );
`);

// Migration Helpers (for existing databases)
const migrations = [
    { table: 'products', column: 'image_url', type: 'TEXT' },
    { table: 'products', column: 'display_order', type: 'INTEGER DEFAULT 0' },
    { table: 'product_variants', column: 'type', type: "TEXT DEFAULT 'choice'" },
    { table: 'orders', column: 'is_cleared', type: 'INTEGER DEFAULT 0' },
    { table: 'categories', column: 'display_order', type: 'INTEGER DEFAULT 0' }
];

migrations.forEach(m => {
    try {
        db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
    } catch (e) {
        // Column likely exists
    }
});

module.exports = db;
