import express from "express";
import connectDB from "./connection.js";
import errorHandler from "./middlewares/errorHandler.js";

import checkAuthentication from "./middlewares/checkAuthentication.js";
import getAuthUser from "./middlewares/getAuthUser.js";
import cookieParser from "cookie-parser";

import urlRouter from "./routes/url.js";
import staticRouter from "./routes/static.js";
import userRouter from "./routes/user.js";

const app = express();
const PORT = 8001;

app.use(express.static("public"));
app.set("view engine", "ejs");
// app.set("views", "./views");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/url", checkAuthentication, urlRouter);
app.use("/user", userRouter);
app.use("/", getAuthUser, staticRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server was started at port:${PORT}`);
  connectDB("mongodb://127.0.0.1:27017/short-url");
});
