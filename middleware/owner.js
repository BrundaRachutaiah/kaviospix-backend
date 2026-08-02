const Album = require("../models/Album");

const owner = async (req, res, next) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Only the album owner can perform this action" });
    }

    req.album = album;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify album ownership" });
  }
};

module.exports = owner;
