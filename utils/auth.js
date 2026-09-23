import jwt from "jsonwebtoken";

/**
 * Signs a short-lived JWT access token with user data.
 * Sent on every request; expires in 15 minutes.
 * @param {Object} user - Mongoose user document or decoded payload
 *                        (must have _id, email, name, role)
 * @returns {string|null} Signed JWT token, or null on error
 */
export const setAccessToken = (user) => {
  try {
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "15m",
      },
    );

    return token;
  } catch (error) {
    return null;
  }
};

/**
 * Signs a long-lived JWT refresh token.
 * Only sent to POST /user/refresh to obtain a new access token.
 * Expires in 30 days; the `type: "refresh"` claim prevents it from being
 * used as an access token (and vice versa).
 * @param {Object} user - Mongoose user document or decoded payload
 *                        (must have _id, email, name, role)
 * @returns {string|null} Signed JWT token, or null on error
 */
export const setRefreshToken = (user) => {
  try {
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: "refresh",
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30d",
      },
    );

    return token;
  } catch (error) {
    return null;
  }
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - JWT token to verify (access or refresh)
 * @returns {Object|false} Decoded payload { _id, email, name, role, iat, exp }
 *                         (plus `type` for refresh tokens), or false on invalid/expired token
 */
export const getUser = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = decoded;
    return user;
  } catch (error) {
    return false;
  }
};
