/**
 * URL Shortener — application entry point.
 * Wires middleware (cookies, body parsing, soft auth), mounts routers,
 * registers the global error handler, and starts the server.
 */
import express from "express";
import connectDB from "./connection.js";
import errorHandler from "./middlewares/errorHandler.js";
import { checkAuthentication, restrictUser } from "./middlewares/handleAuth.js";

import cookieParser from "cookie-parser";
import "dotenv/config";

import urlRouter from "./routes/url.js";
import staticRouter from "./routes/static.js";
import userRouter from "./routes/user.js";

const app = express();
const PORT = 8001;

// Serve static files (CSS, JS, images) from the "public" directory
app.use(express.static("public"));
app.set("view engine", "ejs");

// --- Middleware ---
// Parse cookies from the request headers (needed to read JWT token)
app.use(cookieParser());
// Parse JSON request bodies (for API requests)
app.use(express.json());
// Parse URL-encoded request bodies (for HTML form submissions)
app.use(express.urlencoded({ extended: false }));

// --- Routes ---
// Soft auth must run BEFORE any router: it decodes the JWT cookie into
// req.user so restrictUser and route handlers can read it. Never blocks.
app.use(checkAuthentication);
// /url routes require authentication (hard gate - blocks unauthenticated users)
app.use("/url", restrictUser(["NORMAL", "ADMIN"]), urlRouter);
// /user routes are public (signup, login - no auth required)
app.use("/user", userRouter);
app.use("/", staticRouter);

// Global error handler - catches unhandled errors from any route
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server was started at port:${PORT}`);
  connectDB("mongodb://127.0.0.1:27017/short-url");
});
