const { schemaComposer } = require("graphql-compose");
const {
  composeMongoose,
  convertSchemaToGraphQL,
} = require("graphql-compose-mongoose");
const mongoose = require("mongoose");
const { ProductTC } = require("./productModel");
const { UserTC } = require("./userModel");

const checkoutItemSchema = new mongoose.Schema({
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
});

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [checkoutItemSchema],
  },
  { timestamps: true }
);

const CheckoutItemTC = convertSchemaToGraphQL(
  checkoutItemSchema,
  "CheckoutItem",
  schemaComposer
);

const Checkout =
  mongoose.models.Checkout || mongoose.model("Checkout", checkoutSchema);

schemaComposer.delete("Checkout");

const CheckoutTC = composeMongoose(Checkout, {});

const ProductsTC = CheckoutTC.getFieldOTC("products");

CheckoutTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.user },
  projection: { user: true },
});

ProductsTC.addRelation("product", {
  resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.product },
  projection: { product: true },
});

module.exports = { Checkout, CheckoutTC, ProductsTC, CheckoutItemTC };
