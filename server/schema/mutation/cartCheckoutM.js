const { GraphQLNonNull, GraphQLError, GraphQLBoolean, GraphQLFloat, GraphQLString, GraphQLID } = require("graphql");
const mongoose = require("mongoose");
const { CartTC, Cart } = require("../../model/cartModel");
const { WishlistTC, Wishlist } = require("../../model/wishListModel");
const { Checkout, CheckoutTC, CheckoutItemTC } = require("../../model/checkoutModal");
const { ProductTC, Product } = require("../../model/productModel");
const { toInputObjectType } = require("graphql-compose");

const CartCheckoutMutation = {
  removeFromWishlist: {
    type: GraphQLBoolean,
    args: {
      productIds: "[MongoID!]!",
    },
    resolve: async (source, { productIds }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }
      try {
        const existingWishlist = await Wishlist.findOne({ user: req.user._id }).lean().select({ products: 1, user: 1 });
        if (!existingWishlist) {
          throw new GraphQLError("no wishlist found");
        }
        await Wishlist.updateOne(
          { user: req.user._id },
          {
            $pull: {
              products: { product: { $in: productIds } },
            },
          },
          { multi: true }
        );

        return true;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("Something went wrong!!");
      }
    },
  },

  addWishlistToCart: {
    type: GraphQLBoolean,
    args: {
      wishListItems: [toInputObjectType(CheckoutItemTC)],
    },
    resolve: async (source, { wishListItems }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }

      try {
        const existingCart = await Cart.findOne({ user: req.user._id }).lean().select({ products: 1, user: 1 });

        if (!existingCart) {
          await new Cart({
            user: req.user._id,
            products: wishListItems,
          }).save();

          return true;
        } else {
          // if (existingCart.user.toString() !== req.user._id.toString()) {
          //   throw new GraphQLError("You are not authorize");
          // }

          const newCartItems = existingCart.products.filter(
            (p) => !wishListItems.some((item) => p.product.toString() === item.product.toString())
          );
          const wishListItemsAddToCart = [...wishListItems, ...newCartItems];
          console.log(newCartItems, wishListItemsAddToCart);

          await Cart.findOneAndUpdate(
            {
              user: req.user._id,
            },
            { products: wishListItemsAddToCart },
            { new: true }
          );
          return true;
        }
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!");
      }
    },
  },

  addToWishlist: {
    type: WishlistTC.NonNull,
    args: {
      quantity: new GraphQLNonNull(GraphQLFloat),
      productId: new GraphQLNonNull(GraphQLString),
    },
    resolve: async (source, { quantity, productId }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }
      try {
        const product = await Product.findById(productId).lean();

        if (!product) {
          throw new GraphQLError("Invalid product id");
        }

        if (Number(quantity) < Number(product.minOrder)) {
          throw new GraphQLError("Quantity must not less than min order");
        }

        let rangePreUnitIdx;

        product?.rangePerUnit?.find((r, i) => {
          if (i + 1 === product.rangePerUnit.length) {
            if (parseFloat(quantity) >= r.qty) {
              rangePreUnitIdx = i;
            }
          } else if (parseFloat(quantity) >= r.qty && parseFloat(quantity) <= product.rangePerUnit[i + 1].qty - 1) {
            rangePreUnitIdx = i;
          }
        });

        // get user cart based on userId
        const existingWishlist = await Wishlist.findOne({ user: req.user._id }).lean().select({ products: 1 });

        const newProduct = {
          quantity,
          product: productId,
          rangePreUnitIdx,
        };

        if (!existingWishlist) {
          throw new GraphQLError("no wishlist found");
          // const wishlist = await new Wishlist({
          //   user: req.user._id,
          //   products: newProduct,
          //   rangePreUnitIdx,
          // }).save();

          // return wishlist;
        } else {
          // if (existingWishlist.user.toString() !== req.user._id.toString()) {
          //   throw new GraphQLError("You are not authorize");
          // }

          // check product already exists in cart
          const productExistsInWishlist = existingWishlist.products.some((doc) =>
            mongoose.Types.ObjectId(productId).equals(doc.product)
          );

          // If so, increment quantity (by number provided to request)
          if (productExistsInWishlist) {
            await Wishlist.findOneAndUpdate(
              { user: req.user._id, "products.product": productId },
              {
                "products.$.quantity": quantity,
                "products.$.rangePreUnitIdx": rangePreUnitIdx,
              }
            ).lean();
          } else {
            await Wishlist.findOneAndUpdate({ user: req.user._id }, { $addToSet: { products: newProduct } }).lean();
          }
        }

        return existingWishlist;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!");
      }
    },
  },

  addToCart: {
    type: CartTC.NonNull,
    args: {
      quantity: new GraphQLNonNull(GraphQLFloat),
      productId: new GraphQLNonNull(GraphQLString),
    },
    resolve: async (source, { quantity, productId }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }
      try {
        const product = await Product.findById(productId).lean();

        if (!product) {
          throw new GraphQLError("Invalid product id");
        }

        if (Number(quantity) < Number(product.minOrder)) {
          throw new GraphQLError("Quantity must not less than min order");
        }

        let rangePreUnitIdx;

        product?.rangePerUnit?.find((r, i) => {
          if (i + 1 === product.rangePerUnit.length) {
            if (parseFloat(quantity) >= r.qty) {
              rangePreUnitIdx = i;
            }
          } else if (parseFloat(quantity) >= r.qty && parseFloat(quantity) <= product.rangePerUnit[i + 1].qty - 1) {
            rangePreUnitIdx = i;
          }
        });

        // get user cart based on userId
        const existingCart = await Cart.findOne({ user: req.user._id }).lean().select({ products: 1, user: 1 });

        const newProduct = {
          quantity,
          product: productId,
          rangePreUnitIdx,
        };

        if (!existingCart) {
          const cart = await new Cart({
            user: req.user._id,
            products: newProduct,
            rangePreUnitIdx,
          }).save();

          return cart;
        } else {
          // if (existingCart.user.toString() !== req.user._id.toString()) {
          //   throw new GraphQLError("You are not authorize");
          // }

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
            ).lean();
          } else {
            await Cart.findOneAndUpdate({ user: req.user._id }, { $addToSet: { products: newProduct } }).lean();
          }
        }

        return existingCart;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!");
      }
    },
  },

  addToCheckout: {
    type: CheckoutTC.NonNull,
    args: {
      quantity: GraphQLFloat,
      productId: GraphQLString,
    },
    resolve: async (source, { quantity, productId }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }
      try {
        let cart;

        const existingCheckout = await Checkout.findOne({ user: req.user._id }).lean().select({ user: 1 });

        if (!existingCheckout) {
          await new Checkout({ user: req.user._id, products: [] }).save();
        }

        // if (existingCheckout.user.toString() !== req.user._id.toString()) {
        //   throw new GraphQLError("You are not authorize");
        // }

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
        }

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

          return checkout;
        }
        const product = await Product.findById(productId).lean();

        if (!product) {
          throw new GraphQLError("Invalid product id");
        }

        let rangePreUnitIdx;

        product?.rangePerUnit?.find((r, i) => {
          if (i + 1 === product.rangePerUnit.length) {
            if (parseFloat(quantity) >= r.qty) {
              rangePreUnitIdx = i;
            }
          } else if (parseFloat(quantity) >= r.qty && parseFloat(quantity) <= product.rangePerUnit[i + 1].qty - 1) {
            rangePreUnitIdx = i;
          }
        });

        const productInCart = cart.products.find((p) => p.product._id.toString() === productId.toString());

        const newProduct = { quantity, product: productId, rangePreUnitIdx };
        if (!productInCart) {
          await Cart.findOneAndUpdate({ user: req.user._id }, { $addToSet: { products: newProduct } }).lean();
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

        return checkout;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!");
      }
    },
  },

  removeFromCart: {
    type: CartTC.NonNull,
    args: {
      productId: new GraphQLNonNull(GraphQLString),
    },
    resolve: async (source, { productId }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }
      try {
        const existingCart = await Cart.findOne({ user: req.user._id }).lean().select({ user: 1 });

        if (!existingCart) {
          throw new GraphQLError("No Cart found");
        }

        // if (existingCart.user.toString() !== req.user._id.toString()) {
        //   throw new GraphQLError("You are not authorize");
        // }

        const cart = await Cart.findOneAndUpdate(
          { user: req.user._id },
          {
            $pull: {
              products: { product: mongoose.Types.ObjectId(productId) },
            },
          },
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
          {
            $pull: {
              products: { product: mongoose.Types.ObjectId(productId) },
            },
          },
          { new: true }
        )
          .lean()
          .select({ products: 1 })
          .populate({
            path: "products.product",
            model: "Product",
          });

        return cart;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!");
      }
    },
  },
};

module.exports = { CartCheckoutMutation };
