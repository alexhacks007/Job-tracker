const db = require('../db/setup');

const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check simple role from JWT/Users table first (Fallback)
      if (user.role === 'Super Admin' || user.role === requiredRole) {
        return next();
      }

      // Advanced User_Roles check
      const sql = `
        SELECT r.name 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = ?
      `;

      
      db.all(sql, [user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        const userRoles = rows.map(r => r.name);
        if (userRoles.includes('Super Admin') || userRoles.includes(requiredRole)) {
          return next();
        } else {
          // Check if base role matches something powerful enough (assuming Super Admin has highest clearance)
          return res.status(403).json({ message: `Forbidden: Requires ${requiredRole} role` });
        }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error analyzing roles' });
    }
  };
};

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Override for Super Admin
      if (user.role === 'Super Admin') return next();

      const sql = `
        SELECT p.name 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ?
      `;

      db.all(sql, [user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        
        const userPermissions = rows.map(p => p.name);
        if (userPermissions.includes(requiredPermission)) {
          return next();
        } else {
          return res.status(403).json({ message: `Forbidden: Requires ${requiredPermission} permission` });
        }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error analyzing permissions' });
    }
  };
};

const checkBehaviorAccess = (accessLevel) => {
  return (req, res, next) => {
    // In a full implementation, this checks if the user's psychology/behavior metrics 
    // are eligible to access deep insights or if the Admin has DEEP_INSIGHTS clearance.
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Analyst AI') {
      return next();
    }
    
    // E.g., if user asks for their own basic insights, allow it. But deep tracking is admin only.
    if (accessLevel === 'DEEP_INSIGHTS') {
      return res.status(403).json({ message: 'Forbidden: Requires systemic DEEP_INSIGHTS access.' });
    }
    
    next();
  };
};

module.exports = {
  checkRole,
  checkPermission,
  checkBehaviorAccess
};
