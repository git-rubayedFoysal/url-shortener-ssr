import mongoose from "mongoose";

/**
 * Connects Mongoose to the given MongoDB URL.
 * Called once at server startup from index.js.
 * @param {string} url - MongoDB connection string (e.g., mongodb://127.0.0.1:27017/short-url)
 * @returns {Promise<void>}
 */
const connectDB = async (url) => {
  await mongoose.connect(url);
  console.log("Database was connected successfully!");
};

export default connectDB;
