import express from "express";
import {
  handleUserSignup,
  handleUserLogin,
  handleRefreshToken,
} from "../controllers/user.js";
const router = express.Router();

// POST /user/ — Register a new user account
router.post("/", handleUserSignup);

// POST /user/login — Authenticate and get access + refresh cookies
router.post("/login", handleUserLogin);

// POST /user/refresh — Exchange a valid refresh cookie for a new
// access token (rotates both cookies). Redirects to /login on failure.
router.post("/refresh", handleRefreshToken);

export default router;
