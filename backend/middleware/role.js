const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
    }

    next();
  };
};

module.exports = roleMiddleware;
