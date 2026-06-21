const db = require('../db/setup');

class Job {
  static create({ user_id, company_name, job_role, location, salary, status, applied_date, platform }) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO jobs (user_id, company_name, job_role, location, salary, status, applied_date, platform) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [user_id, company_name, job_role, location, salary, status, applied_date, platform || null], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static findByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC`;
      db.all(sql, [user_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findAll() {
      return new Promise((resolve, reject) => {
        const sql = `SELECT jobs.*, users.name as user_name FROM jobs JOIN users ON jobs.user_id = users.id ORDER BY jobs.created_at DESC`;
        db.all(sql, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM jobs WHERE id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static update(id, { company_name, job_role, location, salary, status, applied_date, interview_date, interview_result, notes, platform }) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE jobs 
                   SET company_name = ?, job_role = ?, location = ?, salary = ?, status = ?, applied_date = ?, interview_date = ?, interview_result = ?, notes = ?, platform = ? 
                   WHERE id = ?`;
      db.run(sql, [company_name, job_role, location, salary, status, applied_date, interview_date, interview_result, notes, platform || null, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM jobs WHERE id = ?`;
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Job;
