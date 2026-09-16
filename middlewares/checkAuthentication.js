import { getUser } from "../utils/auth.js";

/**
 * Hard authentication gate.
 * Blocks the request if no valid JWT token is found in cookies.
 * Used on protected routes (e.g., /url/*).
 */
const checkAuthentication = async (req, res, next) => {
  const token = req.cookies?.token;

  const user = getUser(token);
  if (!user) {
    return res.render("login", {
      error: "Something went wrong, please try again",
    });
  }

  // Attach decoded user payload to request for downstream handlers
  req.user = user;
  next();
};

export default checkAuthentication;
