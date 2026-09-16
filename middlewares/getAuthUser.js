import { getUser } from "../utils/auth.js";

/**
 * Soft authentication gate.
 * Optionally detects a logged-in user but never blocks the request.
 * Used on public routes (e.g., /) so the page renders differently
 * for authenticated vs anonymous users.
 */
const getAuthUser = (req, res, next) => {
  const token = req.cookies?.token;

  const user = getUser(token);

  if (user) {
    req.user = user;
  }
  // Always calls next() — unauthenticated users are not blocked
  next();
};

export default getAuthUser;
