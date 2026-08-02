const express = require("express");

const auth = require("../middleware/auth");
const {
  createAlbum,
  updateAlbumDescription,
  shareAlbum,
  deleteAlbum,
  getAllAlbums,
} = require("../controllers/album.controller");
const {
  uploadImage,
  getAllImages,
  getFavoriteImages,
} = require("../controllers/image.controller");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(auth);

router.get("/", getAllAlbums);
router.post("/", createAlbum);
router.put("/:albumId", updateAlbumDescription);
router.post("/:albumId/share", shareAlbum);
router.delete("/:albumId", deleteAlbum);

router.get("/:albumId/images/favorites", getFavoriteImages);
router.get("/:albumId/images", getAllImages);
router.post("/:albumId/images", upload.single("file"), uploadImage);

module.exports = router;
