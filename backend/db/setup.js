const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');

// Create the db instance
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected successfully.');

    // Create Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
    if (err) console.error('Error creating users table', err);
      else {
        console.log('Users table created or already exists.');
        // Migrate: add avatar + social link columns if missing (safe to run multiple times)
        const extraColumns = ['avatar', 'linkedin', 'naukri', 'workindia', 'glassdoor', 'portfolio', 'last_active_at'];
        extraColumns.forEach(col => {
          let columnDef = 'TEXT';
          if (col === 'last_active_at') columnDef = 'DATETIME';
          
          db.run(`ALTER TABLE users ADD COLUMN ${col} ${columnDef}`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
              console.error(`Error adding ${col} column:`, err.message);
            }
          });
        });

        // Migrate jobs table: add platform column
        db.run(`ALTER TABLE jobs ADD COLUMN platform TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding platform column to jobs:', err.message);
          }
        });
      }
    });

    // Create Jobs table
    db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        job_role TEXT NOT NULL,
        location TEXT,
        salary TEXT,
        status TEXT NOT NULL DEFAULT 'Applied',
        applied_date DATE,
        interview_date DATE,
        interview_result TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating jobs table', err);
      else console.log('Jobs table created or already exists.');
    });

    // Create Companies table
    db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT,
        email TEXT,
        address TEXT,
        website TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating companies table', err);
      else console.log('Companies table created or already exists.');
    });

    // Create Todos table
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        company_id INTEGER,
        company_name TEXT,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'pending',
        start_date DATE,
        start_time TEXT,
        end_date DATE,
        end_time TEXT,
        alert_enabled INTEGER DEFAULT 0,
        alert_type TEXT DEFAULT 'days_before',
        alert_days_before INTEGER DEFAULT 1,
        alert_time TEXT DEFAULT '09:00',
        image TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating todos table', err);
      else console.log('Todos table created or already exists.');
    });

    // Create User Goals table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_applications INTEGER DEFAULT 50,
        timeframe TEXT DEFAULT 'monthly',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating user_goals table', err);
      else console.log('User Goals table created or already exists.');
    });

    // Create Activity Logs table (for heatmap and streak)
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating activity_logs table', err);
      else console.log('Activity Logs table created or already exists.');
    });

    // Create Achievements table
    db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_name TEXT NOT NULL,
        description TEXT,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating achievements table', err);
      else console.log('Achievements table created or already exists.');
    });

    // ----------------------------------------------------
    // ADVANCED AI & RBAC EVOLUTION MODEL
    // ----------------------------------------------------
    
    // Create Roles table
    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `, (err) => {
      if (err) console.error('Error creating roles table', err);
      else console.log('Roles table created or already exists.');
    });

    // Create Permissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `, (err) => {
      if (err) console.error('Error creating permissions table', err);
      else console.log('Permissions table created or already exists.');
    });

    // Create Role_Permissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles (id),
        FOREIGN KEY (permission_id) REFERENCES permissions (id)
      )
    `, (err) => {
      if (err) console.error('Error creating role_permissions table', err);
      else console.log('Role_Permissions table created or already exists.');
    });

    // Create User_Roles table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (role_id) REFERENCES roles (id)
      )
    `, (err) => {
      if (err) console.error('Error creating user_roles table', err);
      else console.log('User_Roles table created or already exists.');
    });

    // Create Behavior Metrics table
    db.run(`
      CREATE TABLE IF NOT EXISTS behavior_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        consistency_score INTEGER DEFAULT 0,
        focus_score INTEGER DEFAULT 0,
        drop_rate INTEGER DEFAULT 0,
        action_speed INTEGER DEFAULT 0,
        cognitive_load INTEGER DEFAULT 0,
        mindset_profile TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating behavior_metrics table', err);
      else console.log('Behavior Metrics table created or already exists.');
    });

    // Create AI Insights table
    db.run(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        insight_type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) console.error('Error creating ai_insights table', err);
      else console.log('AI Insights table created or already exists.');
    });

    // Create Feature Flags table
    db.run(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flag_name TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 0
      )
    `, (err) => {
      if (err) console.error('Error creating feature_flags table', err);
      else console.log('Feature Flags table created or already exists.');
    });

  }
});

module.exports = db;
