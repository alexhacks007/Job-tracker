const db = require('../db/setup');

class Company {
  static create({ user_id, name, mobile, email, address, website, notes }) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO companies (user_id, name, mobile, email, address, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [user_id, name, mobile || null, email || null, address || null, website || null, notes || null], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static findByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM companies WHERE user_id = ? ORDER BY name ASC`;
      db.all(sql, [user_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Check if any existing company has the same name, mobile, or email
  static findDuplicate(user_id, { name, mobile, email }, excludeId = null) {
    return new Promise((resolve, reject) => {
      const conditions = [];
      const params = [];

      // Case-insensitive name match
      conditions.push(`LOWER(name) = LOWER(?)`);
      params.push(name);

      // Only include mobile/email checks if they are non-empty
      if (mobile && mobile.trim()) {
        conditions.push(`(mobile IS NOT NULL AND mobile = ?)`);
        params.push(mobile.trim());
      }
      if (email && email.trim()) {
        conditions.push(`(LOWER(email) IS NOT NULL AND LOWER(email) = LOWER(?))`);
        params.push(email.trim());
      }

      let sql = `SELECT * FROM companies WHERE user_id = ? AND (${conditions.join(' OR ')})`;
      const args = [user_id, ...params];

      if (excludeId) {
        sql += ` AND id != ?`;
        args.push(excludeId);
      }

      db.get(sql, args, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM companies ORDER BY name ASC`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM companies WHERE id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static update(id, { name, mobile, email, address, website, notes }) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE companies SET name = ?, mobile = ?, email = ?, address = ?, website = ?, notes = ? WHERE id = ?`;
      db.run(sql, [name, mobile || null, email || null, address || null, website || null, notes || null, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM companies WHERE id = ?`;
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Company;
