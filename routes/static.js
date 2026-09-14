import express from "express";
import URL from "../models/url.js";
import { deleteSession } from "../utils/auth.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const user = req.user; // set by getAuthUser middleware

    if (!user) {
      return res.render("home", {
        auth: false,
      });
    }

    const allUrls = await URL.find({ createdBy: req.user._id }).sort({
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

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.get("/login", (req, res) => {
  return res.render("login");
});

router.get("/logout", async (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) return res.render("login");

  const success = await deleteSession(sessionId);

  if (success) {
    res.clearCookie("sessionId");
    res.redirect("/");
  }
});
export default router;
