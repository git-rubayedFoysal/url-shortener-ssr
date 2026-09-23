import express from "express";
import {
  handleGenerateNewURL,
  handleRedirectToUrl,
  handleGetAnalytics,
} from "../controllers/url.js";
const router = express.Router();

// POST /url/ — Create a new shortened URL
router.post("/", handleGenerateNewURL);

// Specific routes must come before generic :shortId parameter routes
// GET /url/analytics/:shortId — Get click analytics (owner only)
router.get("/analytics/:shortId", handleGetAnalytics);

// GET /url/:shortId — Redirect to original URL (generic route last)
router.get("/:shortId", handleRedirectToUrl);

export default router;
