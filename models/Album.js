const mongoose = require("mongoose");
const { randomUUID: uuidv4 } = require("crypto");

const AlbumSchema = new mongoose.Schema(
  {
    albumId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    sharedWith: {
      type: [String],
      default: [],
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

AlbumSchema.pre("save", function normalizeSharedWith() {
  this.sharedWith = [...new Set((this.sharedWith || []).map((email) => email.toLowerCase()))];
});

module.exports = mongoose.model("Album", AlbumSchema);