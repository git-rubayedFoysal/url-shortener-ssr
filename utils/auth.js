import jwt from "jsonwebtoken";

/**
 * Signs a JWT access token with user data.
 * Token expires in 30 days.
 * @param {Object} user - Mongoose user document (must have _id, email, name)
 * @returns {string|null} Signed JWT token, or null on error
 */
export const setToken = (user) => {
  try {
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
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
 * Verifies a JWT token and returns the decoded user payload.
 * @param {string} token - JWT token to verify
 * @returns {Object|false} Decoded payload { _id, email, name, iat, exp }, or false on invalid/expired token
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
