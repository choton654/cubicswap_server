const asyncHandler = require("express-async-handler");
const { Category } = require("../model/categoryModel");
const { Product } = require("../model/productModel");

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { category, keyword, limit, cursor, pageNumber } = req.query;
  let findObj = {};
  let products = [];
  if (category) {
    findObj = { categories: [category] };
  }
  if (keyword) {
    findObj = {
      name: {
        $regex: keyword,
        $options: "i",
      },
    };
  }
  const pageSize = 12;
  const page = Number(pageNumber) || 1;

  try {
    const count = await Product.countDocuments(findObj);

    products = await Product.find(findObj)
      .lean()
      .select({ name: 1, price: 1, brand: 1, images: 1, _id: 1, minOrder: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    return res.json({
      products,
      count: products.length,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    return res.status(404).json({ success: true, msg: "something went wrong!" });
  }
});

// const keyword = req.query.keyword
//   ? {
//       name: {
//         $regex: req.query.keyword,
//         $options: "i",
//       },
//     }
//   : {};

// const products = await Product.find({ ...keyword })
//   .limit(pageSize)
//   .skip(pageSize * (page - 1));

// if (limit) {
// } else {
//   products = await Product.find(findObj)
//     .lean()
//     .limit(Number(limit))
//     .select({ name: 1, image: 1, price: 1, brand: 1 })
//     .sort({ createdAt: -1 });
// }

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .lean()
    .select({ brand: 1, name: 1, description: 1, price: 1 });
  try {
    if (product) {
      return res.status(200).json({ success: true, product });
    } else {
      return res.status(404).json({ success: true, msg: "Product not found" });
    }
  } catch (error) {
    return res.status(404).json({ success: true, msg: "something went wrong!" });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.remove();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create a product
// @route   POST /api/products/create
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    images,
    categories,
    inStock,
    description,
    price,
    storeId,
    minOrder,
    rangePerUnit,
    details,
  } = req.body;

  if (
    !name ||
    !brand ||
    !images ||
    !categories ||
    !description ||
    !inStock ||
    !price ||
    !storeId ||
    !minOrder ||
    !rangePerUnit
  ) {
    return res.status(404).json({ success: false, msg: "Required field is missing" });
  }

  if (
    rangePerUnit.find((e, i) => parseFloat(e.qty) < parseFloat(minOrder)) ||
    rangePerUnit.find((e, i) => parseFloat(e.pricePerUnit) > parseFloat(price))
  ) {
    return res.status(404).json({ success: false, msg: "invalid selling capacity" });
  }

  const product = new Product({
    user: req.user._id,
    name,
    brand,
    images,
    categories,
    description,
    price: parseFloat(price),
    storeId,
    minOrder,
    inStock,
    rangePerUnit,
    details,
  });

  try {
    const createdProduct = await product.save();

    // await Category.updateMany({ _id: categories }, { hasProduct: true });

    return res.status(201).json({ success: true, product: createdProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get products
// @route   Get /api/products/me
// @access  Private/Seller
const getMyProducts = asyncHandler(async (req, res) => {
  const { pageNumber } = req.query;
  const { storeId } = req.params;

  const pageSize = 10;
  const page = Number(pageNumber) || 1;
  try {
    const count = await Product.countDocuments({ storeId });

    const products = await Product.find({ storeId }, { _id: 1, name: 1, images: { $slice: 1 } })
      .lean()
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    return res.status(201).json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Required field is missing" });
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  try {
    const [Steel, Plastic, Fashion, Shoes] = await Promise.all([
      Product.find({ category: "Steel" })
        .lean()
        .select({
          brand: 1,
          name: 1,
          images: 1,
          category: 1,
          price: 1,
        })
        .limit(4)
        .sort({ createdAt: -1 }),
      Product.find({ category: "Plastic" })
        .lean()
        .select({
          brand: 1,
          name: 1,
          images: 1,
          category: 1,
          price: 1,
        })
        .limit(4)
        .sort({ createdAt: -1 }),
      Product.find({ category: "Fashion" })
        .lean()
        .select({
          brand: 1,
          name: 1,
          images: 1,
          category: 1,
          price: 1,
        })
        .limit(4)
        .sort({ createdAt: -1 }),
      Product.find({ category: "Shoes" })
        .lean()
        .select({
          brand: 1,
          name: 1,
          images: 1,
          category: 1,
          price: 1,
        })
        .limit(4)
        .sort({ createdAt: -1 }),
    ]);

    const topProds = [
      { name: "Steel", products: Steel },
      { name: "Plastic", products: Plastic },
      { name: "Fashion", products: Fashion },
      { name: "Shoes", products: Shoes },
    ];
    return res.status(200).json({
      success: true,
      topProds,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ success: false, msg: "Required field is missing" });
  }

  // const products = await Product.aggregate([
  //   { $sort: { createdAt: -1 } },
  //   {
  //     $group: {
  //       _id: "$category",
  //       products: { $push: "$$ROOT" },
  //     },
  //   },
  //   // { $slice: ["$products", 4] },
  //   // { $slice: -4 },
  // ]);
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getMyProducts,
};
