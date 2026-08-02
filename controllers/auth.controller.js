const passport = require("passport");
const { signToken } = require("../utils/jwt");

const googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      message: "Google OAuth is not configured",
    });
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })(req, res, next);
};

const buildAuthPayload = (user) => ({
  userId: user.userId,
  name: user.name,
  email: user.email,
  picture: user.picture,
});

const googleAuthCallback = [
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        message: "Google OAuth is not configured",
      });
    }

    return next();
  },
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    passport.authenticate("google", { session: false }, (error, user, info) => {
      if (error) {
        console.error("Google auth error:", error);
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      if (!user) {
        console.warn("Google auth rejected:", info);
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      try {
        const token = signToken(user);
        const payload = buildAuthPayload(user);
        const redirectUrl = new URL("/login", frontendUrl);

        redirectUrl.searchParams.set("token", token);
        redirectUrl.searchParams.set(
          "user",
          Buffer.from(JSON.stringify(payload)).toString("base64")
        );

        return res.redirect(redirectUrl.toString());
      } catch (authError) {
        console.error("Failed to create auth session:", authError);
        return res.redirect(`${frontendUrl}/login?error=auth_session_failed`);
      }
    })(req, res, next);
  },
];

const googleAuthFailure = (req, res) => {
  return res.status(401).json({ message: "Google authentication failed" });
};

module.exports = {
  googleAuth,
  googleAuthCallback,
  googleAuthFailure,
};
