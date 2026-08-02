const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");

dotenv.config();

const { initializeDatabase } = require("./config/db");
require("./config/passport");

const authRoutes = require("./routes/auth.routes");
const albumRoutes = require("./routes/album.routes");
const imageRoutes = require("./routes/image.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/albums", albumRoutes);
app.use("/", imageRoutes);

app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File size must be 5MB or smaller" });
  }

  if (err && err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to KaviosPix API",
    endpoints: {
      auth: "/auth/google",
      albums: "/albums",
    },
  });
});

const PORT = process.env.PORT || 4000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
