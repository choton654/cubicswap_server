const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { UserTC } = require("./userModel");
const { schemaComposer } = require("graphql-compose");
const { CategoryTC } = require("./categoryModel");
// const { CategoryTC } = require("./categoryModel");

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const rangePerUnitSchema = mongoose.Schema({
  pricePerUnit: { type: Number, required: true },
  qty: { type: Number, required: true },
});

const detailsSchema = mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldValue: { type: [String], required: true },
});

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Store",
    },
    views: {
      type: [Number],
    },
    name: {
      type: String,
      required: true,
    },
    images: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
      validate: [val => val.length <= 10, "images exceeds the limit of 10"],
    },
    videos: {
      type: [
        {
          type: String,
          // required: true,
        },
      ],
      validate: [val => val.length <= 2, "videos exceeds the limit of 2"],
    },
    brand: {
      type: String,
      // required: true,
    },
    colors: [
      {
        type: String,
      },
    ],
    sizes: [
      {
        type: String,
      },
    ],
    inStock: {
      type: Number,
      required: true,
      default: 1,
    },
    minOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    rangePerUnit: [{ type: rangePerUnitSchema, required: true }],
    unit: {
      type: String,
      required: true,
      default: "Piece",
    },
    categories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      require: true,
    },
    // category: {
    //   type: String,
    //   enum: ["Plastic", "Steel", "Fashion", "Shoes", "Others"],
    //   // require: true,
    //   default: "Others",
    // },
    description: {
      type: String,
      required: true,
    },

    details: [{ type: detailsSchema }],

    reviews: [reviewSchema],
    rating: {
      type: Number,
      // required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      // required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
productSchema.index({
  price: 1,
  brand: 1,
  name: 1,
  image: 1,
  category: 1,
  description: 1,
  user: 1,
  minOrder: 1,
});
productSchema.index({
  name: 1,
  image: 1,
  price: 1,
  user: 1,
});
productSchema.index({
  categories: 1,
});
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

schemaComposer.delete("Product");

const ProductTC = composeMongoose(Product, {});

const ReviewTC = ProductTC.getFieldOTC("reviews");

ProductTC.addRelation("user", {
  resolver: () =>
    UserTC.mongooseResolvers.findById({
      lean: true,
    }),
  prepareArgs: { _id: source => source.user },
  projection: { user: true },
});

ProductTC.addRelation("categories", {
  resolver: () =>
    CategoryTC.mongooseResolvers.findByIds({
      lean: true,
    }),
  prepareArgs: { _ids: source => source.categories },
  projection: { categories: true },
});

ProductTC.addRelation("pagecategories", {
  resolver: () =>
    CategoryTC.mongooseResolvers.pagination({
      lean: true,
      findManyOpts: {
        filter: true,
      },
    }),
  // prepareArgs: { _ids: (source) => source.categories },
  // projection: { categories: true },
});

ReviewTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.user },
  projection: { user: true },
});

module.exports = { detailsSchema, Product, ProductTC };
