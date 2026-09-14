import express from "express";
import {
  handleGenerateNewURL,
  handleRedirectToUrl,
  handleGetAnalytics,
} from "../controllers/url.js";
const router = express.Router();

router.post("/", handleGenerateNewURL);

router.get("/:shortId", handleRedirectToUrl);

router.get("/analytics/:shortId", handleGetAnalytics);

export default router;
