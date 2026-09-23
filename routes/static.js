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

// GET /logout — Clear both auth cookies (access + refresh) and redirect home
router.get("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  return res.redirect("/");
});
export default router;
