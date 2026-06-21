const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    
    // Update last active status asynchronously
    try {
      const db = require('../db/setup');
      db.run("UPDATE users SET last_active_at = ? WHERE id = ?", [new Date().toISOString(), req.user.id], (err) => {
         if(err) console.error("Failed to update last_active_at", err);
      });
    } catch (dbErr) {}

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

module.exports = authMiddleware;
