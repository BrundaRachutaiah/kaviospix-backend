const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.post("/test-user", async (req, res) => {
  try {
    const user = new User({
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      googleId: "123456789",
      picture: "https://dummyimage.com/photo.jpg",
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;