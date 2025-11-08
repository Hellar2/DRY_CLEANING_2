// middleware/roleMiddleware.js
module.exports = function allowedRoles(roles = []) {
  // roles = ["Admin"] or ["Staff", "Admin"]
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient privileges" });
    }
    next();
  };
};
