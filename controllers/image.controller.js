const Album = require("../models/Album");
const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");

const isValidBoolean = (value) => typeof value === "boolean" || value === "true" || value === "false";

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
  }

  return [...new Set(String(tags).split(",").map((tag) => tag.trim()).filter(Boolean))];
};

const getUserEmail = (user) => String(user?.email || "").trim().toLowerCase();

const uploadBufferToCloudinary = (buffer, originalname) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kaviospix",
        resource_type: "image",
        public_id: `${Date.now()}-${originalname}`.replace(/\s+/g, "-"),
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

const hasAlbumAccess = (album, user) => {
  const userEmail = getUserEmail(user);
  return album.ownerId === user.userId || (userEmail && album.sharedWith.includes(userEmail));
};

const ensureAlbumAccess = async (albumId, user) => {
  const album = await Album.findOne({ albumId });

  if (!album) {
    return { error: { status: 404, message: "Album not found" } };
  }

  if (!hasAlbumAccess(album, user)) {
    return { error: { status: 403, message: "You do not have access to this album" } };
  }

  return { album };
};

const uploadImage = async (req, res) => {
  try {
    const access = await ensureAlbumAccess(req.params.albumId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }
    const size = req.file.size;
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File size must be 5MB or smaller" });
    }

    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);

    const { tags, person = "", isFavorite = false } = req.body;
    const image = await Image.create({
      albumId: req.params.albumId,
      name: req.file.originalname,
      imageUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      tags: normalizeTags(tags),
      person: typeof person === "string" ? person.trim() : "",
      isFavorite: parseBoolean(isFavorite) ?? false,
      comments: [],
      size,
      uploadedAt: new Date(),
      uploadedBy: req.user.userId,
    });

    return res.status(201).json(image);
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload image" });
  }
};

const updateFavorite = async (req, res) => {
  try {
    const access = await ensureAlbumAccess(req.params.albumId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const image = await Image.findOne({
      imageId: req.params.imageId,
      albumId: req.params.albumId,
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (!isValidBoolean(req.body.isFavorite)) {
      return res.status(400).json({ message: "isFavorite must be a boolean" });
    }

    image.isFavorite = parseBoolean(req.body.isFavorite);
    await image.save();

    return res.json(image);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update favorite status" });
  }
};

const addComment = async (req, res) => {
  try {
    const access = await ensureAlbumAccess(req.params.albumId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const { comment } = req.body;
    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const image = await Image.findOne({
      imageId: req.params.imageId,
      albumId: req.params.albumId,
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    image.comments.push(comment.trim());
    await image.save();

    return res.json(image);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add comment" });
  }
};

const deleteImage = async (req, res) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Only the album owner can delete images" });
    }

    const image = await Image.findOne({
      imageId: req.params.imageId,
      albumId: req.params.albumId,
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(image.cloudinaryPublicId, {
        resource_type: "image",
      });
    }

    await Image.deleteOne({ imageId: image.imageId });

    return res.json({ message: "Image deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete image" });
  }
};

const getAllImages = async (req, res) => {
  try {
    const access = await ensureAlbumAccess(req.params.albumId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const { tags } = req.query;
    const filter = { albumId: req.params.albumId };

    if (tags) {
      const requestedTags = normalizeTags(tags);
      filter.tags = { $all: requestedTags };
    }

    const images = await Image.find(filter).sort({ uploadedAt: -1 });

    return res.json(images);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch images" });
  }
};

const getFavoriteImages = async (req, res) => {
  try {
    const access = await ensureAlbumAccess(req.params.albumId, req.user);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const images = await Image.find({
      albumId: req.params.albumId,
      isFavorite: true,
    }).sort({ uploadedAt: -1 });

    return res.json(images);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch favorite images" });
  }
};

module.exports = {
  uploadImage,
  updateFavorite,
  addComment,
  deleteImage,
  getAllImages,
  getFavoriteImages,
};
