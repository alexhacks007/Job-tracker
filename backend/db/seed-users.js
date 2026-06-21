const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const seedUsers = async () => {
  console.log('Seeding initial Super Admin user...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  db.serialize(() => {
    // 1. Insert into users table
    const insertUser = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
    db.run(insertUser, ['System God', 'admin@tracker.com', hashedPassword, 'Super Admin'], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log('Super Admin user already exists (admin@tracker.com).');
        } else {
          console.error('Error creating user:', err.message);
        }
      } else {
        const userId = this.lastID;
        console.log(`Created Super Admin user. ID: ${userId}`);
        
        // 2. Fetch the Super Admin role_id
        db.get(`SELECT id FROM roles WHERE name = 'Super Admin'`, (err, role) => {
          if (err || !role) {
            console.log('Roles empty. Make sure you click "Run Auto-Seeder" in the UI later.');
          } else {
            // 3. Map user to advanced RBAC
            db.run(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, role.id], (err) => {
              if (!err) console.log('Successfully mapped user to Super Admin advanced role!');
            });
          }
        });
      }
    });

    // Let's create a dummy standard user too
    const insertNormal = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
    db.run(insertNormal, ['Test User', 'user@tracker.com', hashedPassword, 'user'], function(err) {
      if (!err) console.log('Created test Normal User (user@tracker.com). ID: ' + this.lastID);
    });
  });
};

seedUsers();
