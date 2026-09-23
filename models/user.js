import mongoose from "mongoose";

/**
 * User Schema
 * Stores user account information.
 * Password is bcrypt-hashed in controllers/user.js before it reaches save —
 * never store plaintext here.
 */
const userSchema = new mongoose.Schema(
  {
    // Full display name of the user
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate registrations with the same email
    },
    // Bcrypt hash of the user's password (hashed in controllers/user.js)
    password: {
      type: String,
      required: true,
    },
    // Authorization role — assigned server-side only (never from the client),
    // defaults to NORMAL; set ADMIN manually in the DB for admin accounts
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "NORMAL"],
      default: "NORMAL",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchema);
export default User;
