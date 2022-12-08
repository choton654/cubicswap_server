const router = require("express").Router();

const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  getMyProducts,
  getTopProducts,
  getProductsHome,
  getAllProductIds,
  getSingleProduct,
  getCategoryProducts,
  getParentCategoryProducts,
  getMidCategoryProducts,
  getStoreProducts,
  getStore,
  getStoreExists
} = require("../controllers/productController.js");
const { protect, admin, seller } = require("../middleware/authMiddleware.js");

router.route("/").get(getProducts);
router.route("/home").get(getProductsHome);
router.route("/allProductIds").get(getAllProductIds);
router.route("/oneProduct/:productId").get(getSingleProduct);
router.route("/category/:catId").get(getCategoryProducts);
router.route("/midCategory/:mCatId").get(getMidCategoryProducts);
router.route("/parentCategory/:pCatId").get(getParentCategoryProducts);
router.route("/store/products/:storeId").get(getStoreProducts);
router.route("/store/:storeId").get(getStore);
router.route("/store/isExists").get(protect,getStoreExists);
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
