import express from "express";
import URL from "../models/url.js";
import { restrictUser } from "../middlewares/handleAuth.js";

const router = express.Router();

/**
 * GET /admin/urls — Admin dashboard.
 * ADMIN-only (enforced by restrictUser). Lists ALL shortened URLs, newest first.
 */
router.get("/admin/urls", restrictUser(["ADMIN"]), async (req, res, next) => {
  try {
    const user = req.user; // set by checkAuthentication middleware

    // Fetch all URLs, newest first, with owner name+email populated
    // (field selection excludes password)
    const allUrls = await URL.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    return res.render("home", {
      urls: allUrls,
      user: { name: user.name },
      showOwner: true, // tells home.ejs to render the "Created By" column
    });
  } catch (error) {
    next(error); // let errorHandler respond instead of hanging
  }
});
/**
 * GET / — Home page.
 * Shows the URL shortener form.
 * If logged in: shows the user's shortened URLs list.
 * If not logged in: shows "Authentication Required" message.
 */
router.get("/", async (req, res, next) => {
  try {
    const user = req.user; // set by checkAuthentication middleware

    if (!user) {
      return res.render("home", {
        auth: false,
      });
    }

    // Fetch only URLs created by this user, newest first
    const allUrls = await URL.find({ createdBy: user._id }).sort({
      createdAt: -1,
    });

    return res.render("home", {
      urls: allUrls,
      user: { name: req.user.name },
    });
  } catch (error) {
    next(error); // let errorHandler respond instead of hanging
  }
});

// GET /signup — Render the registration form
router.get("/signup", (req, res) => {
  return res.render("signup");
});

// GET /login — Render the login form
router.get("/login", (req, res) => {
  return res.render("login");
});

// GET /logout — Clear JWT cookie and redirect to home
router.get("/logout", async (req, res) => {
  const token = req.cookies?.token;

  if (!token) return res.render("login");

  // Clear the JWT cookie (path must match the path used when setting it)
  res.clearCookie("token", { path: "/" });
  res.redirect("/");
});
export default router;
