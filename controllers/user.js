import User from "../models/user.js";
import { setToken } from "../utils/auth.js";

const user = {};

/**
 * POST /user/ — Register a new user.
 * Creates the account and auto-logs in by setting a JWT cookie.
 */
user.handleUserSignup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    // TODO: Hash password with bcrypt before saving
    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      return res.redirect("/signup");
    }

    // Auto-login: generate token and set cookie so user is logged in immediately
    const token = setToken(user);
    if (!token) {
      return res.redirect("/");
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /user/login — Authenticate an existing user.
 * Validates credentials, generates JWT, and sets cookie.
 */
user.handleUserLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    // TODO: Replace with User.findOne({ email }) + bcrypt.compare()
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.render("login", { error: "Invalid username or password!" });
    }

    // Generate JWT access token
    const token = setToken(user);
    if (!token) {
      return res.render("login", {
        error: "Something went wrong, please try again",
      });
    }

    // Set cookie with security flags
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

export const { handleUserSignup, handleUserLogin } = user;
