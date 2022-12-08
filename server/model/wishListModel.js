const { schemaComposer } = require("graphql-compose");
const {
  composeMongoose,
  convertSchemaToGraphQL,
} = require("graphql-compose-mongoose");
const mongoose = require("mongoose");
const { ProductTC } = require("./productModel");
const { UserTC } = require("./userModel");

const wishlistSchema = new mongoose.Schema(
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
        isdeleted: false,
      },
    ],
  },
  { timestamps: true }
);

const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

schemaComposer.delete("Wishlist");

const WishlistTC = composeMongoose(Wishlist, {});

const ProductsTC = WishlistTC.getFieldOTC("products");

WishlistTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.user },
  projection: { user: true },
});

ProductsTC.addRelation("product", {
  resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.product },
  projection: { product: true },
});

UserTC.addFields({
  myWishlist: {
    type: WishlistTC.getType(),
    resolve: async (source, args, ctx, info) => {
      let wishlist;
      try {
        wishlist = await Wishlist.findOne({ user: source._id }).lean();
        if (wishlist) {
          return wishlist;
        } else {
          wishlist = await Wishlist.create({ user: source._id, products: [] });
          return wishlist;
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  },
});

module.exports = { Wishlist, WishlistTC };
