const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { composeMongoose, convertSchemaToGraphQL } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");

const shippingAddressSchema = new mongoose.Schema({
  city: { type: String },
  pinCode: { type: String },
  state: { type: String },
  houseNo: { type: String },
  roadName: { type: String },
  landmark: { type: String },
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    // fcmToken: {
    //   type: String,
    //   required: [true, "fcm-token is required"],
    //   default: "",
    // },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    isLoggedin: {
      type: Boolean,
      required: true,
      default: false,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "Please add a phone number"],
      minlength: 6,
    },
    shippingAddress: {
      type: shippingAddressSchema,
    },
    sellerType: {
      type: String,
      default: "none",
    },
    authToken: { type: String, default: "" },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

UserSchema.index({
  role: 1,
  shippingAddress: 1,
  name: 1,
  phone: 1,
  email: 1,
  fcmToken: 1,
});

//  encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// jwt token
UserSchema.methods.getSignedJwtToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      name: this.name,
      phone: this.phone,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  return token;
};

// match user entered password to hash password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  //(enteredPassword, this.password);
  return await bcrypt.compare(enteredPassword.toString(), this.password.toString());
};

// generate a hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // generate a token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const UserShippingAddressTC = convertSchemaToGraphQL(shippingAddressSchema, "UserShippingAddress", schemaComposer);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

schemaComposer.delete("User");
const UserTC = composeMongoose(User, {});

// const ShippingAddressTC = UserTC.getFieldOTC("shippingAddress");

module.exports = { UserTC, User, UserShippingAddressTC };

// schemaComposer.Query.addFields({
//   getUsers: UserTC.mongooseResolvers.findMany({
//     filter: true,
//     lean: true,
//     limit: true,
//     skip: true,
//     sort: true,
//   }),
//   getOneUser: UserTC.mongooseResolvers.findOne({ lean: true }),
//   getUserById: UserTC.mongooseResolvers.findById({ lean: true }),
//   getUserByIds: UserTC.mongooseResolvers.findByIds({ lean: true }),
// });

// schemaComposer.Mutation.addFields({
//   addUser: UserTC.mongooseResolvers.createOne(),
// });
