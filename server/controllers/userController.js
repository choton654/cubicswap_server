const asyncHandler = require("express-async-handler");
const { User } = require("../model/userModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");
const { Cart } = require("../model/cartModel");

const sendTokenResponse = async (user, res, fcmToken) => {
  const token = user.getSignedJwtToken();

  // user.fcmToken = fcmToken;

  user.authToken = token;
  user.isLoggedin = true;
  await user.save();

  user.password = undefined;

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "strict",
    // secure: process.env.NODE_ENV !== "development",
    path: "/",
  };
  // res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token");
  // res.set("x-token", token);
  return res.status(200).cookie("token", token, options).json({ success: true, token, user });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  let user;

  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, msg: "Required field is missing" });
  }
  try {
    user = await User.findOne({ phone });
    // && (await user.matchPassword(password))
    if (!user || !(await user.matchPassword(password))) {
      return res.status(404).json({ success: false, msg: "Invalid credential!!" });
    }

    // if (user.isLoggedin) {
    //   return res.status(404).json({ success: false, msg: "already logged in" });
    // }

    await sendTokenResponse(user, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Opps something went wrong!!" });
  }
});

// @desc    logout a user
// @route   POST /api/users/logout
// @access  Public
const logout = async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { phone: req.user.phone },
      {
        $set: {
          // fcmToken: "",
          authToken: "",
          isLoggedin: false,
        },
      }
    );

    req.user = undefined;
    return res.status(200).cookie("token", "").json({ success: true, msg: "logout success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "error in logout" });
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, code } = req.body;

  if (!name || !email || !password || !phone || !code) {
    return res.status(400).json({ success: false, msg: "Required field is missing" });
  }

  try {
    const userExists = await User.findOne({ phone }).lean().select({ phone: 1 });

    if (userExists) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    if (user) {
      await sendTokenResponse(user, res);
    } else {
      return res.status(404).json({ success: false, msg: "invalid user data" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Opps something went wrong!!" });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({ role: "seller" });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(400).json({ success: "false", msg: "No user found" });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city, pinCode, state, houseNo, roadName, landmark, role, type } = req.body;

  try {
    const user = await User.findById(req.user._id);
    let updatedUser;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);
      updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, { password: newPassword }, { new: true });
    }
    if (user) {
      if (!type) {
        return res.status(400).json({ success: false, msg: "type is required" });
      }
      if (type === "checkout") {
        if (!city || !pinCode || !state || !houseNo || !roadName || !landmark || !phone || !name) {
          return res.status(400).json({ success: false, msg: "Required field is missing" });
        }
        updatedUser = await User.findOneAndUpdate(
          { _id: req.user._id },
          {
            name,
            email: user.email,
            phone: phone ? phone : user.phone,
            shippingAddress: {
              city,
              pinCode,
              state,
              houseNo,
              roadName,
              landmark,
            },
          },
          { new: true }
        );
      }

      if (type === "role") {
        if (!role) {
          return res.status(400).json({ success: false, msg: "Required field is missing" });
        }
        updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, { role }, { new: true });
      }

      if (type === "profile") {
        //("run profile type");
        if (!name || !email) {
          return res.status(400).json({ success: false, msg: "Required field is missing" });
        }
        updatedUser = await User.findOneAndUpdate(
          { _id: req.user._id },
          {
            name,
            email,
            phone: phone ? phone : user.phone,
          },
          { new: true }
        );
      }
      //(updatedUser);

      return res.json({
        success: true,
        user: updatedUser,
      });
    } else {
      return res.status(404).json({ success: false, msg: "user not found" });
    }
  } catch (error) {
    //(error);
    return res.status(500).json({ success: false, msg: "something went wrong!" });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // console.log(req.cookies);
  try {
    let cartItems = [];
    const existingCart = await Cart.findOne({ user: req.user._id }).lean().select({ _id: 1 });
    if (existingCart) {
      cartItems = await Cart.aggregate([
        {
          $match: { user: req.user._id },
        },
        { $unwind: "$products" },
        { $project: { products: 1 } },
        {
          $lookup: {
            from: "products",
            let: {
              product_id: "$products.product",
            },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$product_id"] } } }, { $project: { _id: 1 } }],
            as: "products",
          },
        },
      ]);
    }
    const user = await User.findOne({ _id: req.user._id }).lean().select({
      role: 1,
      shippingAddress: 1,
      name: 1,
      phone: 1,
      // fcmToken: 1,
      email: 1,
      password: -1,
    });
    if (user) {
      user.password = undefined;
      return res.status(200).json({
        success: true,
        user: { ...user, cartItems },
      });
    } else {
      return res.status(404).json({ success: false, msg: "user not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "something went wrong!" });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    add user
// @route   GET /api/users/add
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, sellerType, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, msg: "Required field is missing" });
  }

  try {
    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "seller",
      sellerType,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          ...user._doc,
          password: undefined,
        },
      });
    } else {
      return res.status(400).json({ success: false, msg: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "something went wrong!" });
  }
});

// @desc   forgot password
// route   POST /api/v1/auth/forgotpassword
// access  public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      success: false,
      err: "there is no user with that email",
    });
  }

  // get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // const BASE_URL =
  //   process.env.NODE_ENV === "production"
  //     ? "https://rsk-ecom.herokuapp.com"
  //     : "http://localhost:3000";

  const message = `<a href='${process.env.BASE_URL}/forgetPassword/${resetToken}'>Click this link to reset your password</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    return res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    //(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ success: false, err: "Email could not be send" });
  }
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ sucess: false, err: "Invalid token" });
  }

  //("user", user);

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, res);
});

module.exports = {
  createUser,
  getUsers,
  // verifyPhone,
  registerUser,
  getUserProfile,
  loginUser,
  deleteUser,
  updateUser,
  getUserById,
  updateUserProfile,
  logout,
  forgotPassword,
  resetPassword,
};

// const verifyPhone = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
//   try {
//     client.verify
//       .services(process.env.TWILIO_NOTIFY_SID)
//       .verifications.create({ to: `+91${phone}`, channel: "sms" })
//       .then((verification) => {
//         console.log(verification.sid);
//         res.json({ id: verification.sid });
//       });
//   } catch (error) {
//     console.error(error);
//   }
// });
// const verification_check = await client.verify
//   .services(process.env.TWILIO_NOTIFY_SID)
//   .verificationChecks.create({ to: `+91${phone}`, code: `${code}` });
// if (verification_check.status === "approved") {
// create user
// } else {
//   return res
//     .status(404)
//     .json({ success: false, msg: "Your OTP didn't match" });
// }
// const options = {
//   expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//   httpOnly: true,
//   secure: process.env.NODE_ENV !== "development",
//   path: "/",
// };

// res.cookie("user", user, options);
// res.cookie("token", token, options);
// res.setHeader(
//   "Set-Cookie",
//   cookie.serialize("token", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     expires: new Date(0),
//     sameSite: "strict",
//     path: "/",
//   })
// );
