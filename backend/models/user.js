const db = require('../db/setup');

class User {
  static create({ name, email, password, role }) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
      db.run(sql, [name, email, password, role], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, email, role });
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static update(id, { name, email, linkedin, naukri, workindia, glassdoor, portfolio }) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET name = ?, email = ?, linkedin = ?, naukri = ?, workindia = ?, glassdoor = ?, portfolio = ? WHERE id = ?`;
      db.run(sql, [name, email, linkedin || null, naukri || null, workindia || null, glassdoor || null, portfolio || null, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static updatePassword(id, hashedPassword) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET password = ? WHERE id = ?`;
      db.run(sql, [hashedPassword, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static updateAvatar(id, avatar) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET avatar = ? WHERE id = ?`;
      db.run(sql, [avatar, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getPermissions(id) {
    return new Promise((resolve, reject) => {
      // Get permissions from advanced rbac lookup
      const sql = `
        SELECT p.name 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ?
      `;
      db.all(sql, [id], (err, rows) => {
        if (err) return reject(err);
        
        let perms = rows.map(r => r.name);
        
        // If DB is not fully seeded yet, fallback onto basic 'role' logic
        db.get("SELECT role FROM users WHERE id = ?", [id], (err, row) => {
          if (!row) return resolve([]);
          const basicRole = row.role;
          if (perms.length === 0) {
             if (basicRole === 'Super Admin') {
               perms = ['ALL'];
             } else if (basicRole === 'admin') {
               perms = ['USER_MANAGEMENT', 'JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS', 'SYSTEM_CONTROL'];
             } else {
               perms = ['JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS'];
             }
          }
          
          // Additional override: Super Admin always has ALL permissions essentially
          if (basicRole === 'Super Admin' && !perms.includes('ALL')) {
             perms.push('ALL');
          }

          resolve(perms);
        });
      });
    });
  }
}

module.exports = User;
