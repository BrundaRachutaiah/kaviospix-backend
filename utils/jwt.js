const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kaviospix-dev-secret";

const signToken = (user) =>
  jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  signToken,
  verifyToken,
};
