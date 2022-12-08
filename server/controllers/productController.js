const asyncHandler = require("express-async-handler");
const { Category } = require("../model/categoryModel");
const { Product } = require("../model/productModel");
const { Store } = require("../model/storeModel");

const getStoreExists = asyncHandler(async (req, res) => {
  try {
    const existingStore = await Store.findOne({
      owner: req.user._id,
    }).lean().select({_id:1});
    return res.status(200).json({ existingStore });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId)
      .populate("owner", "_id name phone email")
      .lean();
    // .select({ _id: 1, storeName: 1, categories: 1 });

    // const storeCategories = await Category.find({ _id: store.categories })
    //   .lean()
    //   .select({ name: 1 });

    // const products = await Product.find({
    //   storeId: mongoose.Types.ObjectId(store._id),
    // })
    //   .lean()
    //   .select({
    //     name: 1,
    //     images: 1,
    //     brand: 1,
    //     price: 1,
    //   });

    return res.status(200).json({
      id: storeId,
      store: store,
    });
  } catch (error) {
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getStoreProducts = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  try {
    const store = await Store.findById(storeId)
      .populate("owner", "_id name phone email")
      .lean()
      .select({ _id: 1, storeName: 1, categories: 1 });

    const storeCategories = await Category.find({ _id: store.categories })
      .lean()
      .select({ name: 1 });

    const pageSize = 10;
    const page = 1;
    const count = await Product.countDocuments({
      storeId: store._id,
    });

    const products = await Product.find({
      storeId: store._id,
    })
      .lean()
      .limit(pageSize)
      .select({
        name: 1,
        images: 1,
        brand: 1,
        price: 1,
      })
      .sort({ name: 1 });

    return res.status(200).json({
      data: {
        pages: [
          {
            products,
            count: products.length,
            page,
            pages: Math.ceil(count / pageSize),
          },
        ],
        pageParams: [null],
      },
      storeCategories: storeCategories,
      id: storeId,
      store: store,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getMidCategoryProducts = asyncHandler(async (req, res) => {
  const { mCatId } = req.params;

  try {
    const mainParent = await Category.findById(mCatId).lean();

    const parent = await Category.findById(
      mainParent.parentCatId.toString()
    ).lean();

    const categoriesOfParent1 = await Category.find({
      parentCatId: mCatId,
    }).lean();

    const pageSize = 12;
    const page = 1;
    const count = await Product.countDocuments({
      categories: categoriesOfParent1.map((c) => c._id),
    });

    const products = await Product.find({
      categories: { $in: categoriesOfParent1.map((c) => c._id) },
    })
      .lean()
      .select({ _id: 1, minOrder: 1, name: 1, images: 1, price: 1, brand: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: {
        pages: [
          {
            products,
            count: products.length,
            page,
            pages: Math.ceil(count / pageSize),
          },
        ],
        pageParams: [null],
      },
      mCatId,
      name: mainParent.name,
      parent: parent,
      categories1: categoriesOfParent1,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getParentCategoryProducts = asyncHandler(async (req, res) => {
  const { pCatId } = req.params;

  try {
    const mainParent = await Category.findById(pCatId).lean();

    const categoriesOfParent1 = await Category.find({
      parentCatId: pCatId,
    }).lean();

    const categoriesOfParent2 = await Category.find({
      parentCatId: categoriesOfParent1.map((c) => c._id),
    }).lean();

    let findObj = {};

    if (categoriesOfParent1[0].hasProduct) {
      findObj = {
        categories: { $in: categoriesOfParent1.map((c) => c._id) },
      };
    } else {
      console.log("innnnnn");
      findObj = {
        categories: { $in: categoriesOfParent2.map((c) => c._id) },
      };
    }

    const pageSize = 12;
    const page = 1;
    const count = await Product.countDocuments(findObj);

    const products = await Product.find(findObj)
      .lean()
      .select({ _id: 1, minOrder: 1, name: 1, images: 1, price: 1, brand: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: {
        pages: [
          {
            products,
            count: products.length,
            page,
            pages: Math.ceil(count / pageSize),
          },
        ],
        pageParams: [null],
      },
      pCatId,
      name: mainParent.name,
      categories2: categoriesOfParent2,
      categories1: categoriesOfParent1,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getCategoryProducts = asyncHandler(async (req, res) => {
  try {
    const { catId } = req.params;
    const pageSize = 12;
    const page = 1;
    const count = await Product.countDocuments({ categories: [catId] });
    const products = await Product.find({ categories: [catId] })
      .lean()
      .select({ _id: 1, minOrder: 1, name: 1, images: 1, price: 1, brand: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    const category = await Category.findOne({ _id: catId })
      .lean()
      .select({ name: 1, parentCatId: 1 });

    const parent = await Category.findById(
      category.parentCatId.toString()
    ).lean();

    console.log(parent);

    let mainParent;

    if (parent.parentCatId === undefined) {
      mainParent = parent;
    } else {
      mainParent = await Category.findById(
        parent.parentCatId.toString()
      ).lean();
    }

    // const categories = await Category.find({
    //   parentCatId: category.parentCatId.toString(),
    // })
    //   .lean()
    //   .select({ _id: 1, name: 1 });

    return res.status(200).json({
      data: {
        pages: [
          {
            products,
            count: products.length,
            page,
            pages: Math.ceil(count / pageSize),
          },
        ],
        pageParams: [null],
      },
      catId,
      name: category.name,
      mainParent: mainParent,
      parent: parent,
      category: category,
    });

    // return {
    //   props: {
    //     data: JSON.stringify({
    //       pages: [
    //         {
    //           products,
    //           count: products.length,
    //           page,
    //           pages: Math.ceil(count / pageSize),
    //         },
    //       ],
    //       pageParams: [null],
    //     }),
    //     catId,
    //     name: category.name,
    //     mainParent: JSON.stringify(mainParent),
    //     parent: JSON.stringify(parent),
    //     category: JSON.stringify(category),
    //   },
    //   revalidate: 1,
    // };
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getAllProductIds = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find()
      .lean()
      .select({ _id: 1 })
      .sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});
const getSingleProduct = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId)
      .lean()
      .select({
        brand: 1,
        name: 1,
        images: 1,
        description: 1,
        price: 1,
        user: 1,
        unit: 1,
        storeId: 1,
        minOrder: 1,
        inStock: 1,
        rangePerUnit: 1,
        categories: 1,
        details: 1,
        views: 1,
        _id: 1,
      })
      .populate("user", "_id name");

    const category = await Category.findOne({ _id: product.categories[0] })
      .lean()
      .select({ name: 1, parentCatId: 1 });

    const parent = await Category.findById(
      category.parentCatId.toString()
    ).lean();

    let mainParent;

    if (parent.parentCatId === undefined) {
      mainParent = parent;
    } else {
      mainParent = await Category.findById(
        parent.parentCatId.toString()
      ).lean();
    }

    const store = await Store.findById(product.storeId, {
      storeName: 1,
      phone: 1,
      images: { $slice: 1 },
    }).lean();

    return res.status(200).json({
      product: product,
      id: productId,
      store: store,
      mainParent: mainParent,
      parent: parent,
      category: category,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});

const getProductsHome = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ parentCatId: null })
      .lean()
      .limit(4)
      .select({ _id: 1, name: 1 });

    const [a, b, c, d] = await Promise.all([
      Category.find({
        parentCatId: categories[0],
      }).lean(),
      Category.find({
        parentCatId: categories[1],
      }).lean(),
      Category.find({
        parentCatId: categories[2],
      }).lean(),
      Category.find({
        parentCatId: categories[3],
      }).lean(),
    ]);

    const [a1, b1, c1, d1] = await Promise.all([
      Category.find({
        parentCatId: a.map((c) => c._id),
      }).lean(),

      Category.find({
        parentCatId: b.map((c) => c._id),
      }).lean(),

      Category.find({
        parentCatId: c.map((c) => c._id),
      }).lean(),

      Category.find({
        parentCatId: d.map((c) => c._id),
      }).lean(),
    ]);

    const [p1, p2, p3, p4, p5] = await Promise.all([
      Product.find(
        {
          categories: { $in: a1.map((c) => c._id) },
        },
        {
          brand: 1,
          name: 1,
          images: { $slice: 1 },
          category: 1,
          price: 1,
          minOrder: 1,
          _id: 1,
          views: 1,
        }
      )
        .lean()
        .limit(8),

      Product.find(
        {
          categories: { $in: b1.map((c) => c._id) },
        },
        {
          brand: 1,
          name: 1,
          images: { $slice: 1 },
          category: 1,
          price: 1,
          minOrder: 1,
          _id: 1,
          views: 1,
        }
      )
        .lean()
        .limit(8),

      Product.find(
        {
          categories: { $in: c1.map((c) => c._id) },
        },
        {
          brand: 1,
          name: 1,
          images: { $slice: 1 },
          category: 1,
          price: 1,
          minOrder: 1,
          _id: 1,
          views: 1,
        }
      )
        .lean()
        .limit(8),

      Product.find(
        {
          categories: { $in: d1.map((c) => c._id) },
        },
        {
          brand: 1,
          name: 1,
          images: { $slice: 1 },
          category: 1,
          price: 1,
          minOrder: 1,
          _id: 1,
          views: 1,
        }
      )
        .lean()
        .limit(8),

      Product.find(
        {},
        {
          brand: 1,
          name: 1,
          images: { $slice: 1 },
          category: 1,
          price: 1,
          minOrder: 1,
          _id: 1,
          views: 1,
        }
      )
        .lean()
        .limit(8)
        .sort({ createdAt: -1 }),
    ]);

    const topProds = [
      { _id: categories[0]._id, name: categories[0].name, products: p1 },
      { _id: categories[1]._id, name: categories[1].name, products: p2 },
      { _id: categories[2]._id, name: categories[2].name, products: p3 },
      { _id: categories[3]._id, name: categories[3].name, products: p4 },
    ];

    return res.status(200).json({
      topProds: topProds,
      newArrivas: p5,
      categories: categories,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
  }
});

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
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
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
    return res
      .status(404)
      .json({ success: true, msg: "something went wrong!" });
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
    return res
      .status(404)
      .json({ success: false, msg: "Required field is missing" });
  }

  if (
    rangePerUnit.find((e, i) => parseFloat(e.qty) < parseFloat(minOrder)) ||
    rangePerUnit.find((e, i) => parseFloat(e.pricePerUnit) > parseFloat(price))
  ) {
    return res
      .status(404)
      .json({ success: false, msg: "invalid selling capacity" });
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
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

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

    const products = await Product.find(
      { storeId },
      { _id: 1, name: 1, images: { $slice: 1 } }
    )
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
    return res
      .status(400)
      .json({ success: false, msg: "Required field is missing" });
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

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

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

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
    return res
      .status(400)
      .json({ success: false, msg: "Required field is missing" });
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
  getProductsHome,
  getAllProductIds,
  getSingleProduct,
  getCategoryProducts,
  getParentCategoryProducts,
  getMidCategoryProducts,
  getStoreProducts,
  getStore,
  getStoreExists,
};
