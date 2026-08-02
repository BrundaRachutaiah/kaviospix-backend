const express = require("express");
const {
  googleAuth,
  googleAuthCallback,
  googleAuthFailure,
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/google/failure", googleAuthFailure);

module.exports = router;
