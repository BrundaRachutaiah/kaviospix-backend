const Album = require("../models/Album");
const Image = require("../models/Image");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeEmails = (emails = []) =>
  [...new Set(emails.map((email) => String(email).trim().toLowerCase()).filter(Boolean))];

const getUserEmail = (user) => String(user?.email || "").trim().toLowerCase();

const hasAlbumAccess = (album, user) => {
  const userEmail = getUserEmail(user);
  return album.ownerId === user.userId || (userEmail && album.sharedWith.includes(userEmail));
};

const createAlbum = async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Album name is required" });
    }

    const album = await Album.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      ownerId: req.user.userId,
      sharedWith: [],
    });

    return res.status(201).json(album);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create album" });
  }
};

const updateAlbumDescription = async (req, res) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Only the owner can update this album" });
    }

    const { description = "" } = req.body;
    album.description = typeof description === "string" ? description.trim() : "";
    await album.save();

    return res.json(album);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update album" });
  }
};

const shareAlbum = async (req, res) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Only the owner can share this album" });
    }

    const emails = normalizeEmails(req.body.emails || []);

    if (!emails.length) {
      return res.status(400).json({ message: "At least one email is required" });
    }

    for (const email of emails) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: `Invalid email: ${email}` });
      }
    }

    const existingUsers = await User.find({ email: { $in: emails } }).select("email");
    const existingEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));
    const missingEmails = emails.filter((email) => !existingEmails.has(email));

    if (missingEmails.length) {
      return res.status(404).json({
        message: "Some users do not exist in the system",
        missingEmails,
      });
    }

    album.sharedWith = normalizeEmails([...album.sharedWith, ...emails]);
    await album.save();

    return res.json(album);
  } catch (error) {
    return res.status(500).json({ message: "Failed to share album" });
  }
};

const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Only the owner can delete this album" });
    }

    const images = await Image.find({ albumId: album.albumId });
    for (const image of images) {
      if (image.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId, {
          resource_type: "image",
        });
      }
    }

    await Image.deleteMany({ albumId: album.albumId });
    await Album.deleteOne({ albumId: album.albumId });

    return res.json({ message: "Album deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete album" });
  }
};

const getAllAlbums = async (req, res) => {
  try {
    const userEmail = getUserEmail(req.user);
    if (!req.user?.userId || !userEmail) {
      return res.status(401).json({ message: "User session is incomplete" });
    }

    const albums = await Album.find({
      $or: [{ ownerId: req.user.userId }, { sharedWith: userEmail }],
    }).sort({ createdAt: -1 });

    const ownerIds = [...new Set(albums.map((album) => album.ownerId))];
    const owners = await User.find({ userId: { $in: ownerIds } }).select("userId name");
    const ownerNameById = new Map(owners.map((owner) => [owner.userId, owner.name]));

    const albumsWithOwnerName = albums.map((album) => ({
      ...album.toObject(),
      ownerName:
        album.ownerId === req.user.userId
          ? "You"
          : ownerNameById.get(album.ownerId) || "Unknown",
    }));

    return res.json(albumsWithOwnerName);
  } catch (error) {
    console.error("getAllAlbums failed:", error);
    return res.status(500).json({ message: "Failed to fetch albums" });
  }
};

module.exports = {
  createAlbum,
  updateAlbumDescription,
  shareAlbum,
  deleteAlbum,
  getAllAlbums,
  hasAlbumAccess,
};