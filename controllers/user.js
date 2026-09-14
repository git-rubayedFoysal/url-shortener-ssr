import { nextTick } from "process";
import User from "../models/user.js";
import { v4 as uuidV4 } from "uuid";
import { setSession } from "../utils/auth.js";

const user = {};

user.handleUserSignup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      return res.redirect("/signup");
    }

    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

user.handleUserLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Bad Request! All Field Required." });
  }

  try {
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.render("login", { error: "Invalid username or password!" });
    }

    const sessionId = uuidV4();

    const isUser = await setSession(sessionId, user);
    if (!isUser) {
      return res.render("login", {
        error: "Something went wrong, please try again",
      });
    }

    res.cookie("sessionId", sessionId);
    return res.redirect("/");
  } catch (error) {
    next(error);
  }
};

export const { handleUserSignup, handleUserLogin } = user;
