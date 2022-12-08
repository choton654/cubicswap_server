const { GraphQLString, GraphQLNonNull, GraphQLError, GraphQLInt } = require("graphql");
const mongoose = require("mongoose");
const { Product, ProductTC } = require("../../model/productModel");

const ProductQuery = {
  getMyProductDetails: {
    type: new GraphQLNonNull(ProductTC.getType()),
    args: {
      productId: "MongoID!",
      user: "MongoID!",
    },

    resolve: async (source, { productId, user }, { req }) => {
      if (!req.user) {
        throw new GraphQLError("Not Authenticated");
      }

      if (req.user.role.toString() !== "admin") {
        throw new GraphQLError("Not Authorized");
      }
      if (user.toString() !== req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        const product = await Product.findOne({
          _id: mongoose.Types.ObjectId(productId),
          // user: mongoose.Types.ObjectId(req.user._id),
        }).lean();
        return product;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("can not found any product");
      }
    },
  },

  // getProductsByCat: ProductTC.mongooseResolvers.pagination({
  //   // perPage:8,
  //   findManyOpts: {
  //     lean: true,
  //     filter: {
  //       isRequired: true,
  //       requiredFields: ["category"],
  //     },
  //   },
  // }),

  getProductsByOptions: ProductTC.mongooseResolvers.pagination({
    findManyOpts: {
      lean: true,
      // filter: {
      //   isRequired: true,
      //   requiredFields: ["storeId"],
      // },
    },
  }),
};

module.exports = { ProductQuery };
