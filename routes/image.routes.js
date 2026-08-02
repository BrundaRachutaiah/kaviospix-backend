const express = require("express");

const auth = require("../middleware/auth");
const {
  updateFavorite,
  addComment,
  deleteImage,
} = require("../controllers/image.controller");

const router = express.Router();

router.use(auth);

router.put("/albums/:albumId/images/:imageId/favorite", updateFavorite);
router.post("/albums/:albumId/images/:imageId/comments", addComment);
router.delete("/albums/:albumId/images/:imageId", deleteImage);

module.exports = router;
