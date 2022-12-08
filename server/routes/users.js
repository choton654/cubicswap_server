const router = require("express").Router();

const {
  getUsers,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserById,
  updateUser,
  logout,
  createUser,
  forgotPassword,
  resetPassword,
  // verifyPhone,
} = require("../controllers/userController");

const { protect, admin } = require("../middleware/authMiddleware.js");

router.get("/all", protect, admin, getUsers);
// router.post("/verifyPhone", verifyPhone);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.post("/add", protect, admin, createUser);
router.route("/forgotpassword").post(forgotPassword);
router.route("/resetpassword/:resettoken").post(resetPassword);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
