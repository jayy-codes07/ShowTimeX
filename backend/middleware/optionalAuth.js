const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Optional auth: attaches req.user if a valid token is present
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }

  next();
};

module.exports = { optionalAuth };
