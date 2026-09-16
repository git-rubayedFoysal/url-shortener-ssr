import express from "express";
import { handleUserSignup, handleUserLogin } from "../controllers/user.js";
const router = express.Router();

// POST /user/ — Register a new user account
router.post("/", handleUserSignup);

// POST /user/login — Authenticate and get JWT cookie
router.post("/login", handleUserLogin);

export default router;
