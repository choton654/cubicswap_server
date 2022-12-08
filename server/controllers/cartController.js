const asyncHandler = require("express-async-handler");
const { Cart } = require("../model/cartModel");
const { Checkout } = require("../model/checkoutModal");
const mongoose = require("mongoose");
const { Product } = require("../model/productModel");

// @desc     add products to cart
// @route   Post /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { quantity, productId } = req.body;

  if (!productId || !quantity) {
    console.log("bodddyyy", req.body);
    return res
      .status(404)
      .json({ success: false, msg: "Required field is missing" });
  }
  try {
    const product = await Product.findById(productId).lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, msg: "Invalid product id" });
    }
    let rangePreUnitIdx;

    product?.rangePerUnit?.find((r, i) => {
      if (i + 1 === product.rangePerUnit.length) {
        if (parseFloat(quantity) >= r.qty) {
          rangePreUnitIdx = i;
        }
      } else if (
        parseFloat(quantity) >= r.qty &&
        parseFloat(quantity) <= product.rangePerUnit[i + 1].qty - 1
      ) {
        rangePreUnitIdx = i;
      }
    });

    // get user cart based on userId
    const existingCart = await Cart.findOne({ user: req.user._id })
      .lean()
      .select({ products: 1 });

    const newProduct = { quantity, product: productId, rangePreUnitIdx };

    if (!existingCart) {
      await new Cart({
        user: req.user._id,
        products: newProduct,
        rangePreUnitIdx,
      }).save();
    } else {
      // check product already exists in cart
      const productExistsInCart = existingCart.products.some((doc) =>
        mongoose.Types.ObjectId(productId).equals(doc.product)
      );

      // If so, increment quantity (by number provided to request)
      if (productExistsInCart) {
        await Cart.findOneAndUpdate(
          { user: req.user._id, "products.product": productId },
          {
            "products.$.quantity": quantity,
            "products.$.rangePreUnitIdx": rangePreUnitIdx,
          }
        )
          .lean()
          .select({ user: 1 });
      } else {
        //("product not Exists");
        await Cart.findOneAndUpdate(
          { user: req.user._id },
          { $addToSet: { products: newProduct } }
        )
          .lean()
          .select({ user: 1 });
      }
    }

    return res.status(200).json({ success: true, msg: "Item added to cart" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     update products to checkout
// @route   Post /api/cart/checkout/update
// @access  Private
const updateCheckoutItem = asyncHandler(async (req, res) => {
  const { quantity, productId } = req.body;

  if (!productId || !quantity) {
    return res
      .status(404)
      .json({ success: false, msg: "Required field is missing" });
  }

  try {
    const existingCheckout = await Checkout.findOne({
      user: req.user._id,
    })
      .lean()
      .select({ products: 1 });

    if (!existingCheckout) {
      return res.status(200).json({ success: false, msg: "No Checkout found" });
    }
    // check product already exists in checkout
    const productExistsCheckout = existingCheckout.products.some((doc) =>
      mongoose.Types.ObjectId(productId).equals(doc.product)
    );
    if (productExistsCheckout) {
      const checkout = await Checkout.findOneAndUpdate(
        { user: req.user._id, "products.product": productId },
        { "products.$.quantity": quantity },
        { new: true }
      )
        .lean()
        .select({ user: 1 });
      return res.status(200).json({
        success: true,
        msg: "item updated in checkout",
        checkout,
      });
    } else {
      return res
        .status(200)
        .json({ success: false, msg: "no product found in checkout" });
    }
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     add products to checkout
// @route   Post /api/cart/checkout
// @access  Private
const addToCheckout = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  let cart;

  try {
    const existingCheckout = await Checkout.findOne({ user: req.user._id })
      .lean()
      .select({ user: 1 });

    if (!existingCheckout) {
      await new Checkout({ user: req.user._id, products: [] }).save();
    }

    await Checkout.findOneAndUpdate(
      {
        user: req.user._id,
      },
      { products: [] }
    ).lean();

    cart = await Cart.findOne({ user: req.user._id })
      .lean()
      // .select({ user: 1 })
      .populate({
        path: "products.product",
        model: "Product",
      });

    if (!cart) {
      cart = await new Cart({ user: req.user._id, products: [] }).save();

      // return res
      //   .status(200)
      //   .json({ success: true, cart: {}, msg: "No cart found" });
    }
    //("cart", cart);
    //(productId);
    if (!productId) {
      const checkout = await Checkout.findOneAndUpdate(
        {
          user: req.user._id,
        },
        { products: cart.products },
        { new: true }
      )
        .lean()
        .select({ products: 1 })
        .populate({
          path: "products.product",
          model: "Product",
        });
      //("checkout", checkout);
      return res.status(200).json({ success: true, checkout });
    }
    const product = await Product.findById(productId).lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, msg: "Invalid product id" });
    }

    let rangePreUnitIdx;

    product?.rangePerUnit?.find((r, i) => {
      if (i + 1 === product.rangePerUnit.length) {
        if (parseFloat(quantity) >= r.qty) {
          rangePreUnitIdx = i;
        }
      } else if (
        parseFloat(quantity) >= r.qty &&
        parseFloat(quantity) <= product.rangePerUnit[i + 1].qty - 1
      ) {
        rangePreUnitIdx = i;
      }
    });

    const productInCart = cart.products.find(
      (p) => p.product._id.toString() === productId.toString()
    );

    const newProduct = { quantity, product: productId, rangePreUnitIdx };
    if (!productInCart) {
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { products: newProduct } }
      ).lean();
    }
    const checkout = await Checkout.findOneAndUpdate(
      {
        user: req.user._id,
      },
      { products: [newProduct] },
      { new: true }
    )
      .lean()
      .select({ products: 1 })
      .populate({
        path: "products.product",
        model: "Product",
      });
    //("checkout", checkout);
    return res.status(200).json({ success: true, checkout });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     get checkout data
// @route   Get /api/cart/checkout
// @access  Private
const getCheckout = asyncHandler(async (req, res) => {
  try {
    // const checkout = await Checkout.findOne({ user: req.user._id })
    //   .lean()
    //   .select({ products: 1 })
    //   .populate({
    //     path: "products.product",
    //     select: "_id name image price",
    //     model: "Product",
    //   });

    const checkout = await Checkout.aggregate([
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
            quantity: "$products.quantity",
            rangePreUnitIdx: "$products.rangePreUnitIdx",
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$product_id"] } } },
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                images: 1,
                user: 1,
                brand: 1,
                rangePerUnit: 1,
                minOrder: 1,
                unit: 1,
                storeId: 1,
              },
            },
            {
              $addFields: {
                quantity: "$$quantity",
                rangePreUnitIdx: "$$rangePreUnitIdx",
              },
            },
          ],
          as: "products",
        },
      },
    ]);

    if (checkout) {
      return res.status(200).json({ success: true, checkout });
    } else {
      return res
        .status(200)
        .json({ success: true, checkout: {}, msg: "No checkout found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     get user cart
// @route   Get /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  try {
    // const cart = await Cart.findOne({ user: req.user._id })
    //   .lean()
    //   .select({ products: 1 })
    //   .populate({
    //     path: "products.product",
    //     select: "_id name image price",
    //     model: "Product",
    //   });

    const cart = await Cart.aggregate([
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
            quantity: "$products.quantity",
            rangePreUnitIdx: "$products.rangePreUnitIdx",
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$product_id"] } } },
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                images: 1,
                brand: 1,
                rangePerUnit: 1,
                minOrder: 1,
                unit: 1,
              },
            },
            {
              $addFields: {
                quantity: "$$quantity",
                rangePreUnitIdx: "$$rangePreUnitIdx",
              },
            },
          ],
          as: "products",
        },
      },
    ]);

    if (cart) {
      return res.status(200).json({ success: true, cart });
    } else {
      return res
        .status(200)
        .json({ success: true, cart: {}, msg: "No cart found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     get user cart
// @route   post /api/cart
// @access  Private
const getItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .lean()
      .select({ products: 1 })
      .populate({
        path: "products.product",
        model: "Product",
      });
    if (cart) {
      //("cart", cart);
      //(productId);
      if (productId) {
        const product = cart.products.find((p) => {
          //("pid", p.product._id);
          return p.product._id.toString() === productId.toString();
        });
        if (product) {
          //("product", product);

          return res
            .status(200)
            .json({ success: true, cart: { products: [product] } });
        } else {
          return res
            .status(200)
            .json({ success: true, msg: "no product found" });
        }
      }
      return res.status(200).json({ success: true, cart });
    } else {
      return res
        .status(200)
        .json({ success: true, cart: {}, msg: "No cart found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc     get user cart
// @route   Get /api/cart
// @access  Private
const removeCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { product: mongoose.Types.ObjectId(productId) } } },
      { new: true }
    )
      .lean()
      .select({ products: 1 })
      .populate({
        path: "products.product",
        model: "Product",
      });
    await Checkout.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { product: mongoose.Types.ObjectId(productId) } } },
      { new: true }
    )
      .lean()
      .select({ products: 1 })
      .populate({
        path: "products.product",
        model: "Product",
      });
    //("removeeee");
    res.status(200).json({ success: true, cart: cart.products });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

module.exports = {
  addToCart,
  getCart,
  removeCart,
  addToCheckout,
  getCheckout,
  getItemFromCart,
  updateCheckoutItem,
};

// const product = cart.products.find((p) => {
//   //("pid", p.product._id);
//   return p.product._id.toString() === productId.toString();
// });
// if (product) {
// } else {
//   return res
//     .status(200)
//     .json({ success: true, msg: "no product found" });
// }
