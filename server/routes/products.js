const router = require("express").Router();

const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  getMyProducts,
  getTopProducts,
} = require("../controllers/productController.js");
const { protect, admin, seller } = require("../middleware/authMiddleware.js");

router.route("/").get(getProducts);
// .post(protect, seller, createProduct);
// router.route("/:id/reviews").post(protect, createProductReview);
router.get("/top", getTopProducts);
router.route("/me/:storeId").get(protect, getMyProducts);
router.route("/create").post(protect, seller, createProduct);
router
  .route("/:id")
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct);

module.exports = router;
