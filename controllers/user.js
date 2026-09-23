import User from "../models/user.js";
import byCrypt from "bcrypt";
import { setAccessToken, setRefreshToken, getUser } from "../utils/auth.js";

const user = {};

// Cookie lifetimes (milliseconds) — must match the JWT expiries in utils/auth.js
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Shared security flags for both auth cookies
const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

/**
 * Sets both auth cookies on the response.
 * @param {Object} res - Express response
 * @param {string} accessToken - Short-lived JWT (cookie: "token")
 * @param {string} refreshToken - Long-lived JWT (cookie: "refreshToken")
 */
const issueAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("token", accessToken, { ...cookieBase, maxAge: ACCESS_MAX_AGE });
  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: REFRESH_MAX_AGE,
  });
};

/**
 * POST /user/ — Register a new user.
 * Creates the account and auto-logs in by setting access + refresh cookies.
 */
user.handleUserSignup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    const hashPassword = await byCrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
    });

    if (!user) {
      return res.redirect("/signup");
    }

    // Auto-login: set short-lived access + long-lived refresh cookies
    const accessToken = setAccessToken(user);
    const refreshToken = setRefreshToken(user);
    if (!accessToken || !refreshToken) {
      return res.redirect("/");
    }

    issueAuthCookies(res, accessToken, refreshToken);

    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /user/login — Authenticate an existing user.
 * Validates credentials, generates access + refresh tokens, sets cookies.
 */
user.handleUserLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "Invalid username or password!" });
    }

    const isValidPassword = await byCrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.render("login", { error: "Invalid username or password!" });
    }

    // Generate short-lived access + long-lived refresh tokens
    const accessToken = setAccessToken(user);
    const refreshToken = setRefreshToken(user);
    if (!accessToken || !refreshToken) {
      return res.render("login", {
        error: "Something went wrong, please try again",
      });
    }

    issueAuthCookies(res, accessToken, refreshToken);
    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /user/refresh — Exchange a valid refresh cookie for a new pair of
 * access + refresh cookies (sliding session; both tokens rotate).
 * Redirects to /login when the refresh cookie is missing, invalid, expired,
 * or is actually an access token.
 */
user.handleRefreshToken = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.redirect("/login");
  }

  const payload = getUser(refreshToken);

  // Must be a valid refresh token — an access token here is rejected
  if (!payload || payload.type !== "refresh" || !payload._id) {
    return res.redirect("/login");
  }

  // Re-issue both tokens from the refresh payload (stateless, no DB hit)
  const accessToken = setAccessToken(payload);
  const newRefreshToken = setRefreshToken(payload);
  if (!accessToken || !newRefreshToken) {
    return res.redirect("/login");
  }

  issueAuthCookies(res, accessToken, newRefreshToken);
  return res.redirect("/");
};

export const { handleUserSignup, handleUserLogin, handleRefreshToken } = user;
