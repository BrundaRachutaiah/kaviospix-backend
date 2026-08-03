const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const { randomUUID: uuidv4 } = require("crypto");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-auth-token"];

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const payload = verifyToken(token);
    let user = null;

    if (payload.userId) {
      user = await User.findOne({ userId: payload.userId });
    }

    if (!user && payload.email) {
      user = await User.findOne({ email: String(payload.email).trim().toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.userId) {
      user.userId = uuidv4();
      await user.save();
    }

    req.user = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;