import mongoose from "mongoose";

/**
 * User Schema
 * Stores user account information.
 * TODO: Add bcrypt pre-save hook to hash passwords before saving.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate registrations with the same email
    },
    password: {
      type: String,
      required: true,
      // TODO: Store hashed password, not plaintext
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchema);
export default User;
