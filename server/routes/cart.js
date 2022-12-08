const router = require("express").Router();

const {
  addToCart,
  getCart,
  removeCart,
  addToCheckout,
  getCheckout,
  updateCheckoutItem,
} = require("../controllers/cartController");
const { protect, user } = require("../middleware/authMiddleware.js");

router
  .route("/")
  .post(protect, user, addToCart)
  .get(protect, user, getCart)
  .put(protect, user, removeCart);
router.post("/checkout", protect, user, addToCheckout);
router.get("/checkout", protect, user, getCheckout);
router.post("/checkout/update", protect, user, updateCheckoutItem);
// router.post("/checkout", protect, getItemFromCart);
// router.route("/:id/reviews").post(protect, createProductReview);
// router.get("/top", getTopProducts);
// router
//   .route("/:id")
//   .get(getProductById)
//   .delete(protect, admin, deleteProduct)
//   .put(protect, admin, updateProduct);

module.exports = router;
