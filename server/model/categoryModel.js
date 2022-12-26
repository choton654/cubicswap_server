const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default: "/img/outline_category_black_24dp.png",
    },
    parentCatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    hasProduct: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

schemaComposer.delete("Category");
const CategoryTC = composeMongoose(Category, {});

CategoryTC.addRelation("parentCatId", {
  resolver: () => CategoryTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.parentCatId },
  projection: { parentCatId: true },
});

CategoryTC.addFields({
  subCategories: {
    type: [CategoryTC],
    resolve: async (source, args, ctx, info) =>
      await Category.find({ parentCatId: source._id, }).lean(),
  },
});
module.exports = { Category, CategoryTC };
