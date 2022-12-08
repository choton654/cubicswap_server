const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { User } = require("../model/userModel");

const protect = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    if (req.user === null) {
      return res
        .status(401)
        .json({ success: false, msg: "Can not found auth user" });
    }
    next();
  } else {
    return res.status(401).json({ success: false, msg: "Not authorized" });
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(401)
      .json({ success: false, msg: "sorry!, admin resources" });
  }
};

const seller = (req, res, next) => {
  if (req.user && req.user.role === "seller") {
    next();
  } else {
    return res
      .status(401)
      .json({ success: false, msg: "sorry!, seller's resources" });
  }
};

const user = (req, res, next) => {
  if (req.user && req.user.role === "user") {
    next();
  } else {
    return res
      .status(401)
      .json({ success: false, msg: "sorry!, user's resources" });
  }
};

const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      if (!token) {
        // return res.status(401).json({ success: false, msg: "Not authorized" });
        throw new Error("Not authorized");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findOne({ phone: decoded.phone })
        .lean()
        .select("-password");
      req.user = user;

      console.log("mid-runnns", user);

      // if (!req.user.isLoggedin) {
      //   req.user = null;
      //   res.cookie("token", "");
      //   throw new Error("not authorize");
      // }
      // res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token");
      // res.set("x-token", token);
      res.cookie("token", token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV !== "development",
        path: "/",
      });
    } catch (error) {
      console.error(error);
      req.user = null;
      res.cookie("token", "");
      // throw new Error("not logged in");
    }
  }
  next();
};

module.exports = { auth, protect, admin, seller, user };
