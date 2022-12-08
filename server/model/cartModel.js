const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { UserTC } = require("./userModel");
const { ProductTC } = require("./productModel");
const { schemaComposer } = require("graphql-compose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        rangePreUnitIdx: {
          type: Number,
          default: 0,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

cartSchema.index({
  user: 1,
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

schemaComposer.delete("Cart");

const CartTC = composeMongoose(Cart, {});

const ProductsTC = CartTC.getFieldOTC("products");

CartTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.user },
  projection: { user: true },
});

UserTC.addFields({
  myCart: {
    type: CartTC.getType(),
    resolve: async (source, args, ctx, info) => {
      let cart;
      try {
        cart = await Cart.findOne({ user: source._id }).lean();
        if (cart) {
          return cart;
        } else {
          cart = await Cart.create({ user: source._id, products: [] });
          return cart;
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  },
});

ProductsTC.addRelation("product", {
  resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.product },
  projection: { product: true },
});

module.exports = { Cart, CartTC };
