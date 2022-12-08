const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { UserTC } = require("./userModel");
const { schemaComposer } = require("graphql-compose");
const { StoreTC } = require("./storeModel");
const { ProductTC } = require("./productModel");

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      // required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  { timestamps: true }
);

const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

querySchema.index({
  updatedAt: 1,
});

const Query = mongoose.models.Query || mongoose.model("Queries", querySchema);

schemaComposer.delete("Query");

const QueryTC = composeMongoose(Query, {});

const ReplyTC = QueryTC.getFieldOTC("replies");

QueryTC.addRelation("userId", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.userId },
  projection: { userId: true },
});

ReplyTC.addRelation("userId", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.userId },
  projection: { userId: true },
});

QueryTC.addRelation("storeId", {
  resolver: () => StoreTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.storeId },
  projection: { storeId: true },
});

ReplyTC.addRelation("storeId", {
  resolver: () => StoreTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.storeId },
  projection: { storeId: true },
});

QueryTC.addRelation("productId", {
  resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.productId },
  projection: { productId: true },
});

ProductTC.addFields({
  queries: {
    type: [QueryTC.getType()],
    resolve: async source => {
      return await Query.find({ productId: source._id });
    },
  },
});

module.exports = { Query, QueryTC };
