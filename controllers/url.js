import { customAlphabet } from "nanoid";
import URL from "../models/url.js";

const url = {};

/**
 * POST /url/ — Generate a new short URL.
 * Creates a random 8-character short ID and associates it with the authenticated user.
 */
url.handleGenerateNewURL = async (req, res, next) => {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "Url is required!" });

  try {
    // Generate a random 8-character alphanumeric short ID
    const generateShortID = customAlphabet(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      8,
    );

    const shortID = generateShortID();

    await URL.create({
      shortId: shortID,
      redirectUrl: body.url,
      createdBy: req.user._id,
    });

    res.render("home", { id: shortID });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /url/:shortId — Redirect to the original URL.
 * Records a visit timestamp in the URL's history.
 */
url.handleRedirectToUrl = async (req, res, next) => {
  const shortID = req.params.shortId;
  if (!shortID) return res.status(400).json({ error: "ShortId is required!" });

  try {
    // Append visit timestamp to history and return updated document
    const updateHistory = await URL.findOneAndUpdate(
      { shortId: shortID },
      {
        $push: {
          visitedHistory: { timestamp: Date.now() },
        },
      },
      { returnDocument: "after" },
    );

    if (!updateHistory) {
      return res.status(404).json({
        error: "URL not found!",
      });
    }

    res.redirect(updateHistory.redirectUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /url/analytics/:shortId — Get click analytics for a short URL.
 * Only returns analytics for URLs owned by the authenticated user.
 */
url.handleGetAnalytics = async (req, res, next) => {
  const shortID = req.params.shortId;
  if (!shortID) return res.status(400).json({ error: "ShortId is required!" });

  try {
    // Find URL by shortId AND createdBy to ensure only the owner can view analytics
    const result = await URL.findOne({
      shortId: shortID,
      createdBy: req.user?._id,
    }).select("visitedHistory");

    if (!result) {
      return res.status(404).json({
        error: "ShortId not found!",
      });
    }

    res.status(200).json({
      totalClick: result.visitedHistory.length,
      analytics: result.visitedHistory,
    });
  } catch (error) {
    next(error);
  }
};

export const { handleGenerateNewURL, handleRedirectToUrl, handleGetAnalytics } =
  url;
