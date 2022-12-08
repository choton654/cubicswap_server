const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLError,
  GraphQLInt,
} = require("graphql");
const mongoose = require("mongoose");
const { Store, StoreTC } = require("../../model/storeModel");

const StoreQuery = {
  getAllStores: StoreTC.mongooseResolvers.findMany({
    lean: true,
  }),
  // .wrapResolve((next) => async (rp) => {
  //   if (!rp.context.req.user) {
  //     throw new GraphQLError("Not Authenticate");
  //   }
  //   if (rp.context.req.user.role.toString() !== "admin") {
  //     throw new GraphQLError("Not Authorized");
  //   }
  //   // if (
  //   //   rp.args.filter.owner.toString() !== rp.context.req.user._id.toString()
  //   // ) {
  //   //   throw new GraphQLError("Not Authorized");
  //   // }
  //   // rp.args.filter.owner = rp.context.req.user._id;

  //   return next(rp);
  // }),

  getMyStore: StoreTC.mongooseResolvers.findOne({
    lean: true,
    filter: {
      isRequired: true,
      requiredFields: ["_id"],
    },
  }),

  getStoreById: StoreTC.mongooseResolvers.findById({
    lean: true,
  }),

  getMyStoreDetails: StoreTC.mongooseResolvers
    .findOne({
      lean: true,
      filter: {
        isRequired: true,
        requiredFields: ["_id"],
      },
    })
    .wrapResolve((next) => async (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }
      if (rp.context.req.user.role.toString() === "user") {
        throw new GraphQLError("Not Authorized");
      }
      // if (
      //   rp.args.filter.owner.toString() !== rp.context.req.user._id.toString()
      // ) {
      //   throw new GraphQLError("Not Authorized");
      // }
      // rp.args.filter.owner = rp.context.req.user._id;

      return next(rp);
    }),

  // getMyStoreDetails: {
  //   type: new GraphQLNonNull(StoreTC.getType()),
  //   args: {
  //     storeId: "MongoID!",
  //     owner: "MongoID!",
  //   },

  //   resolve: async (source, { storeId, owner }, { req }) => {
  //     if (!req.user) {
  //       throw new GraphQLError("Not Authenticated");
  //     }

  //     if (req.user.role.toString() === "user") {
  //       throw new GraphQLError("Not Authorized");
  //     }
  //     if (owner.toString() !== req.user._id.toString()) {
  //       throw new GraphQLError("Not Authorized");
  //     }

  //     try {
  //       const store = await Store.findOne({
  //         _id: mongoose.Types.ObjectId(storeId),
  //         owner: mongoose.Types.ObjectId(req.user._id),
  //       }).lean();
  //       return store;
  //     } catch (error) {
  //       console.error(error);
  //       throw new GraphQLError("can not found any store");
  //     }
  //   },
  // },
};

module.exports = { StoreQuery };
