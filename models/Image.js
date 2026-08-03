const mongoose = require("mongoose");
const { randomUUID: uuidv4 } = require("crypto");

const ImageSchema = new mongoose.Schema(
  {
    imageId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    albumId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    person: {
      type: String,
      default: "",
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    comments: {
      type: [String],
      default: [],
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Image", ImageSchema);