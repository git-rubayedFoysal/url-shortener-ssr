import mongoose from "mongoose";

const connectDB = async (url) => {
  await mongoose.connect(url);
  console.log("Database was connected successfully!");
};

export default connectDB;
