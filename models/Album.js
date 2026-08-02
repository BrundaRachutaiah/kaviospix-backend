const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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

AlbumSchema.pre("save", function normalizeSharedWith(next) {
  this.sharedWith = [...new Set((this.sharedWith || []).map((email) => email.toLowerCase()))];
  next();
});

module.exports = mongoose.model("Album", AlbumSchema);
