import { getSession } from "../utils/auth.js";

const getAuthUser = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  const user = await getSession(sessionId);

  if (user) {
    req.user = user;
  }
  next();
};

export default getAuthUser;
