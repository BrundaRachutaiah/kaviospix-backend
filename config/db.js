const mongoose = require("mongoose");

let connectionPromise = null;

const initializeDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((conn) => {
        console.log("✅ MongoDB Connected Successfully");
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);

        if (!process.env.VERCEL) {
          process.exit(1);
        }

        throw error;
      });
  }

  return connectionPromise;
};

module.exports = {
  initializeDatabase,
};