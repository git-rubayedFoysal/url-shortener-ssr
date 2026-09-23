import { getUser } from "../utils/auth.js";

/**
 * Soft authentication middleware.
 * Reads the JWT cookie and, if present and valid, decodes it into req.user.
 * Never blocks the request — req.user stays undefined when there is no token,
 * or false when the token is invalid/expired.
 * Registered globally in index.js before all routers so every route can
 * optionally read req.user.
 */
export const checkAuthentication = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  const user = getUser(token);
  req.user = user;
  return next();
};

/**
 * Hard authentication + role gate.
 * Redirects to /login if the user is not authenticated, and responds 403
 * if the user's role is not in the allowed roles list.
 * Used on protected routes (e.g., /url/*, /admin/urls).
 */
export const restrictUser = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect("/login");
    }

    const user = req.user;

    if (!roles.includes(user?.role)) {
      return res.status(403).end("UnAuthorized");
    }
    return next();
  };
};
