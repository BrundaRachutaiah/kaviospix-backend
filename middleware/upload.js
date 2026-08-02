const multer = require("multer");
const path = require("path");

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

module.exports = upload;
