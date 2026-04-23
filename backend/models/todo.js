const db = require('../db/setup');

class Todo {
  static create(data) {
    const { user_id, title, description, company_id, company_name, priority, status,
      start_date, start_time, end_date, end_time,
      alert_enabled, alert_type, alert_days_before, alert_time, image, tags } = data;
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO todos (user_id, title, description, company_id, company_name, priority, status,
        start_date, start_time, end_date, end_time, alert_enabled, alert_type, alert_days_before, alert_time, image, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [user_id, title, description || null, company_id || null, company_name || null,
        priority || 'Medium', status || 'pending', start_date || null, start_time || null,
        end_date || null, end_time || null, alert_enabled ? 1 : 0, alert_type || 'days_before',
        alert_days_before || 1, alert_time || '09:00', image || null, tags || null
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static findByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM todos WHERE user_id = ? ORDER BY
        CASE status WHEN 'in_progress' THEN 1 WHEN 'pending' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
        end_date ASC NULLS LAST, created_at DESC`;
      db.all(sql, [user_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM todos WHERE id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static update(id, data) {
    const { title, description, company_id, company_name, priority, status,
      start_date, start_time, end_date, end_time,
      alert_enabled, alert_type, alert_days_before, alert_time, image, tags } = data;
    return new Promise((resolve, reject) => {
      const sql = `UPDATE todos SET title=?, description=?, company_id=?, company_name=?,
        priority=?, status=?, start_date=?, start_time=?, end_date=?, end_time=?,
        alert_enabled=?, alert_type=?, alert_days_before=?, alert_time=?, image=?, tags=?
        WHERE id=?`;
      db.run(sql, [title, description || null, company_id || null, company_name || null,
        priority, status, start_date || null, start_time || null, end_date || null, end_time || null,
        alert_enabled ? 1 : 0, alert_type, alert_days_before, alert_time, image || null, tags || null, id
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE todos SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM todos WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Todo;
