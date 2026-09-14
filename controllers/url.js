import { customAlphabet } from "nanoid";
import URL from "../models/url.js";

const url = {};

url.handleGenerateNewURL = async (req, res, next) => {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "Url is required!" });

  try {
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

url.handleRedirectToUrl = async (req, res, next) => {
  const shortID = req.params.shortId;
  if (!shortID) return res.status(400).json({ error: "ShortId is required!" });

  try {
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

url.handleGetAnalytics = async (req, res, next) => {
  const shortID = req.params.shortId;
  if (!shortID) return res.status(400).json({ error: "ShortId is required!" });

  try {
    const result = await URL.findOne({ shortId: shortID }).select(
      "visitedHistory",
    );

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
