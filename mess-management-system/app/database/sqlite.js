const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

const databasePath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../data/sagemess.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messes (
    _id TEXT PRIMARY KEY, messusername TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, username TEXT NOT NULL,
    password TEXT NOT NULL, phone TEXT, address TEXT, rollNumber TEXT,
    department TEXT, hostel TEXT, roomNumber TEXT, messId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS categories (
    _id TEXT PRIMARY KEY, name TEXT NOT NULL, messId TEXT NOT NULL,
    isMeal INTEGER NOT NULL DEFAULT 0, UNIQUE(name, messId),
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS meals (
    _id TEXT PRIMARY KEY, userId TEXT NOT NULL, messId TEXT NOT NULL,
    numberOfMeal REAL NOT NULL, date TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS expenses (
    _id TEXT PRIMARY KEY, amount REAL NOT NULL, date TEXT NOT NULL, summary TEXT NOT NULL,
    categoryId TEXT NOT NULL, userId TEXT NOT NULL, messId TEXT NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES categories(_id), FOREIGN KEY (userId) REFERENCES users(_id),
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS balances (
    _id TEXT PRIMARY KEY, userId TEXT NOT NULL, categoryId TEXT NOT NULL, messId TEXT NOT NULL,
    amount REAL NOT NULL, date TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(_id), FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS menus (
    _id TEXT PRIMARY KEY, messId TEXT NOT NULL, day TEXT NOT NULL,
    breakfast TEXT NOT NULL DEFAULT '[]', lunch TEXT NOT NULL DEFAULT '[]', snacks TEXT NOT NULL DEFAULT '[]', dinner TEXT NOT NULL DEFAULT '[]',
    specialNote TEXT NOT NULL DEFAULT '', isSpecialDay INTEGER NOT NULL DEFAULT 0, updatedBy TEXT,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(messId, day),
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE, FOREIGN KEY (updatedBy) REFERENCES users(_id)
  );
  CREATE TABLE IF NOT EXISTS feedback (
    _id TEXT PRIMARY KEY, userId TEXT NOT NULL, messId TEXT NOT NULL, type TEXT NOT NULL,
    category TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL, rating REAL,
    status TEXT NOT NULL DEFAULT 'Pending', adminResponse TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE CASCADE, FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS announcements (
    _id TEXT PRIMARY KEY, messId TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
    createdBy TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
    FOREIGN KEY (messId) REFERENCES messes(_id) ON DELETE CASCADE, FOREIGN KEY (createdBy) REFERENCES users(_id)
  );
`);

const configs = {
  mess: { table: 'messes', fields: ['messusername'], defaults: {} },
  user: { table: 'users', fields: ['email', 'username', 'password', 'phone', 'address', 'rollNumber', 'department', 'hostel', 'roomNumber', 'messId', 'role'], defaults: { role: 'user' } },
  category: { table: 'categories', fields: ['name', 'messId', 'isMeal'], defaults: { isMeal: 0 } },
  meal: { table: 'meals', fields: ['userId', 'messId', 'numberOfMeal', 'date'], defaults: {} },
  expense: { table: 'expenses', fields: ['amount', 'date', 'summary', 'categoryId', 'userId', 'messId'], defaults: {} },
  balance: { table: 'balances', fields: ['userId', 'categoryId', 'messId', 'amount', 'date'], defaults: {} },
  menu: { table: 'menus', fields: ['messId', 'day', 'breakfast', 'lunch', 'snacks', 'dinner', 'specialNote', 'isSpecialDay', 'updatedBy'], json: ['breakfast', 'lunch', 'snacks', 'dinner'], boolean: ['isSpecialDay'], timestamps: true, defaults: { breakfast: [], lunch: [], snacks: [], dinner: [], specialNote: '', isSpecialDay: false } },
  feedback: { table: 'feedback', fields: ['userId', 'messId', 'type', 'category', 'subject', 'description', 'rating', 'status', 'adminResponse'], timestamps: true, defaults: { status: 'Pending', adminResponse: '' } },
  announcement: { table: 'announcements', fields: ['messId', 'title', 'message', 'createdBy'], timestamps: true, defaults: {} },
};

function validId(id) { return typeof id === 'string' && id.length > 0 && id.length < 100; }
function normalizeId(id) {
  if (typeof id === 'object' && id !== null) {
    return id._id !== undefined ? id._id : id;
  }
  return id;
}
function doc(row, config) {
  if (!row) return null;
  const value = { ...row };
  (config.json || []).forEach((field) => { try { value[field] = JSON.parse(value[field] || '[]'); } catch { value[field] = []; } });
  (config.boolean || []).forEach((field) => { value[field] = Boolean(value[field]); });
  Object.defineProperty(value, 'toObject', { enumerable: false, value: () => ({ ...value }) });
  return value;
}
function normalize(value, config, key) {
  if ((config.json || []).includes(key)) return JSON.stringify(Array.isArray(value) ? value : []);
  if ((config.boolean || []).includes(key)) return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value;
}
function clause(filter = {}, config) {
  const parts = []; const values = [];
  const add = (field, value) => {
    if (field === '$and') {
      value.forEach((item) => {
        const nested = clause(item, config);
        if (nested.sql) {
          parts.push(nested.sql.replace(/^ WHERE /, ''));
          values.push(...nested.values);
        }
      });
      return;
    }
    const column = field === '_id' ? '_id' : field;
    if (value === null) {
      parts.push(`${column} IS NULL`);
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      if (value.$ne !== undefined) {
        if (value.$ne === null) {
          parts.push(`${column} IS NOT NULL`);
        } else {
          parts.push(`${column} != ?`);
          values.push(normalize(value.$ne, config, column));
        }
      } else if (value.$in !== undefined) {
        if (!Array.isArray(value.$in) || value.$in.length === 0) {
          parts.push('1 = 0');
        } else {
          parts.push(`${column} IN (${value.$in.map(() => '?').join(',')})`);
          values.push(...value.$in.map((item) => normalize(item, config, column)));
        }
      } else if (value.$nin !== undefined) {
        if (!Array.isArray(value.$nin) || value.$nin.length === 0) {
          parts.push('1 = 1');
        } else {
          parts.push(`${column} NOT IN (${value.$nin.map(() => '?').join(',')})`);
          values.push(...value.$nin.map((item) => normalize(item, config, column)));
        }
      } else {
        if (value.$gte !== undefined) { parts.push(`${column} >= ?`); values.push(normalize(value.$gte, config, column)); }
        if (value.$lte !== undefined) { parts.push(`${column} <= ?`); values.push(normalize(value.$lte, config, column)); }
      }
    } else {
      parts.push(`${column} = ?`);
      values.push(normalize(value, config, column));
    }
  };
  Object.entries(filter).forEach(([field, value]) => add(field, value));
  return { sql: parts.length ? ` WHERE ${parts.join(' AND ')}` : '', values };
}
function project(value, selection) {
  if (!value) return null;
  if (!selection) return value;
  const fields = typeof selection === 'string' ? selection.split(/\s+/).filter(Boolean) : Object.entries(selection).filter(([, included]) => included).map(([field]) => field);
  const excluded = typeof selection === 'string' ? fields.filter((field) => field.startsWith('-')).map((field) => field.slice(1)) : Object.entries(selection).filter(([, included]) => !included).map(([field]) => field);
  if (excluded.length) { const copy = { ...value }; excluded.forEach((field) => delete copy[field]); return doc(copy, { json: [], boolean: [] }); }
  if (!fields.length) return value;
  const copy = { _id: value._id }; fields.forEach((field) => { if (value[field] !== undefined) copy[field] = value[field]; }); return doc(copy, { json: [], boolean: [] });
}
class Query {
  constructor(run, many) { this.run = run; this.many = many; this.order = null; this.selection = null; }
  sort(order) { this.order = order; return this; }
  select(selection) { this.selection = selection; return this; }
  lean() { return this; }
  then(resolve, reject) {
    try {
      let result = this.run();
      if (this.order) {
        let key;
        let direction = 1;
        if (typeof this.order === 'string') {
          key = this.order.startsWith('-') ? this.order.slice(1) : this.order;
          direction = this.order.startsWith('-') ? -1 : 1;
        } else {
          const [[k, dir]] = Object.entries(this.order);
          key = k;
          direction = dir < 0 ? -1 : 1;
        }
        const sortFn = (a, b) => {
          const va = a[key];
          const vb = b[key];
          const cmp = va > vb ? 1 : va < vb ? -1 : 0;
          return cmp * direction;
        };
        result = this.many ? (result || []).filter(Boolean).sort(sortFn) : result;
      }
      if (this.selection) {
        result = this.many ? (result || []).map((item) => project(item, this.selection)) : project(result, this.selection);
      }
      return Promise.resolve(result).then(resolve, reject);
    } catch (error) {
      return Promise.reject(error).then(resolve, reject);
    }
  }
}
function createModel(name) {
  const config = configs[name]; const { table, fields } = config;
  const findRows = (filter) => { const where = clause(filter, config); return db.prepare(`SELECT * FROM ${table}${where.sql}`).all(...where.values).map((row) => doc(row, config)); };
  const findOne = (filter) => new Query(() => findRows(filter)[0] || null, false);
  return {
    find(filter = {}, projection) { const query = new Query(() => findRows(filter), true); return projection ? query.select(projection) : query; },
    findOne,
    findById(id, projection) { const query = findOne({ _id: normalizeId(id) }); return projection ? query.select(projection) : query; },
    async create(input) {
      const now = new Date().toISOString();
      const record = { _id: input._id || randomUUID(), ...input };
      if (config.timestamps) {
        record.createdAt = record.createdAt || now;
        record.updatedAt = record.updatedAt || now;
      }
      const defs = config.defaults || {};
      const columns = ['_id', ...fields, ...(config.timestamps ? ['createdAt', 'updatedAt'] : [])];
      const values = columns.map((key) => {
        let raw = record[key];
        if (raw === undefined && defs[key] !== undefined) {
          raw = defs[key];
        }
        return normalize(raw ?? null, config, key);
      });
      db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...values);
      return findOne({ _id: record._id });
    },
    async findOneAndUpdate(filter, update, options = {}) {
      const found = await findOne(filter);
      if (!found) return null;
      const values = { ...(update.$set || update) };
      if (config.timestamps) values.updatedAt = new Date().toISOString();
      const keys = Object.keys(values).filter((key) => fields.includes(key) || key === 'updatedAt');
      if (keys.length) {
        db.prepare(`UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE _id = ?`).run(...keys.map((key) => normalize(values[key], config, key)), found._id);
      }
      let result = options.new ? await findOne({ _id: found._id }) : found;
      if (options.projection || options.select) {
        result = project(result, options.projection || options.select);
      }
      return result;
    },
    findByIdAndUpdate(id, update, options = {}) { return this.findOneAndUpdate({ _id: normalizeId(id) }, update, options); },
    async findOneAndDelete(filter) { const found = await findOne(filter); if (!found) return null; db.prepare(`DELETE FROM ${table} WHERE _id = ?`).run(found._id); return found; },
    findByIdAndRemove(id) { return this.findOneAndDelete({ _id: normalizeId(id) }); },
    async deleteOne(filter) { const found = await findOne(filter); if (!found) return { deletedCount: 0 }; db.prepare(`DELETE FROM ${table} WHERE _id = ?`).run(found._id); return { deletedCount: 1 }; },
    async deleteMany(filter) { const where = clause(filter, config); return db.prepare(`DELETE FROM ${table}${where.sql}`).run(...where.values); },
    async countDocuments(filter = {}) { const where = clause(filter, config); return db.prepare(`SELECT COUNT(*) AS count FROM ${table}${where.sql}`).get(...where.values).count; },
  };
}
module.exports = { db, createModel, validId, databasePath };
