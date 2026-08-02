const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/auth/google/callback";

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account email is required"));
          }

          const name = profile.displayName || email.split("@")[0];
          const picture = profile.photos?.[0]?.value || "";

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name,
              email,
              picture,
            });
          } else {
            user.googleId = profile.id;
            user.name = name;
            user.picture = picture;
            if (!user.userId) {
              user.userId = uuidv4();
            }
            await user.save();
          }

          if (!user.userId) {
            user.userId = uuidv4();
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = passport;
