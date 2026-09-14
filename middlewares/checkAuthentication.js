import { getSession } from "../utils/auth.js";

const checkAuthentication = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  const user = await getSession(sessionId);
  if (!user) {
    return res.render("login", {
      error: "Something went wrong, please try again",
    });
  }

  req.user = user;
  next();
};

export default checkAuthentication;
