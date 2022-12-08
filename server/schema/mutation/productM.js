const { GraphQLNonNull, GraphQLError, GraphQLInt, GraphQLBoolean, GraphQLFloat } = require("graphql");
const { ProductTC, Product } = require("../../model/productModel");
const { Category } = require("../../model/categoryModel");
const mongoose = require("mongoose");

const ProductMutation = {
  updateProductViews: {
    type: ProductTC.NonNull,
    args: {
      productId: `String!`,
      viewId: new GraphQLNonNull(GraphQLFloat),
    },
    resolve: async (source, { productId, viewId }, { req }, info) => {
      const product = await Product.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(productId) },
        { $addToSet: { views: [viewId] } }
      );
      // console.log(product);
      return product;
    },
  },

  updateOneProduct: ProductTC.mongooseResolvers
    .updateOne({
      filter: { isRequired: true, requiredFields: ["_id", "storeId"] },
      record: {
        isRequired: true,
        requiredFields: [
          "name",
          "brand",
          "description",
          // "category",
          "unit",
          "minOrder",
          "rangePerUnit",
          "inStock",
          "price",
          "details",
          "categories",
        ],
      },
    })
    .wrapResolve(next => async rp => {
      try {
        const { _id, storeId } = rp.args.filter;

        if (!rp.context.req.user) {
          throw new GraphQLError("Not Authenticate");
        }
        if (rp.context.req.user.role !== "admin") {
          throw new GraphQLError("Not Authorize");
        }

        // if (user.toString() !== rp.context.req.user._id.toString()) {
        //   throw new GraphQLError("Not Authorized");
        // }
        console.log(_id, storeId);
        const product = await Product.findOne({
          _id,
          storeId,
          // user,
        }).lean();

        if (!product) {
          throw new GraphQLError("No product found");
        }
      } catch (error) {
        console.error(error);
        throw new GraphQLError("Something went wrong");
      }

      return next(rp);
    }),

  createOneProduct: ProductTC.mongooseResolvers
    .createOne({
      record: {
        isRequired: true,
        requiredFields: [
          "name",
          "brand",
          "images",
          "categories",
          "description",
          "inStock",
          "price",
          "storeId",
          "minOrder",
          "rangePerUnit",
        ],
      },
    })
    .wrapResolve(next => async rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }
      if (rp.context.req.user.role === "user") {
        throw new GraphQLError("Not Authorize");
      }

      if (
        rp.args.record.rangePerUnit.find((e, i) => parseFloat(e.qty) < parseFloat(rp.args.record.minOrder)) ||
        rp.args.record.rangePerUnit.find((e, i) => parseFloat(e.pricePerUnit) > parseFloat(rp.args.record.price))
      ) {
        throw new GraphQLError("invalid selling capacity");
      }

      // try {
      //   await Category.updateMany(
      //     { _id: rp.args.record.categories },
      //     { hasProduct: true }
      //   );
      // } catch (error) {
      //   console.error(error);
      //   throw new GraphQLError("something went wrong");
      // }

      return next(rp);
    }),

  //   updateOneProduct: {
  //     type: new GraphQLNonNull(ProductTC.getType()),
  //     args: {
  //       productId: "MongoID!",
  //       storeId: "MongoID!",
  //         user: "MongoID!",

  //         // update fields
  //     },
  //     resolve: async (source, { productId, storeId, user }, { req }, info) => {
  //       if (req.user) {
  //         throw new GraphQLError("Not Authenticate");
  //       }
  //       if (req.user.role === "user") {
  //         throw new GraphQLError("Not Authorize");
  //       }

  //       if (user.toString() !== req.user._id.toString()) {
  //         throw new GraphQLError("Not Authorized");
  //       }

  //       const product = await Product.findOne({_id:productId, storeId, user }).lean();

  //         if (!product) {
  //             throw new GraphQLError("No product found");
  //         }

  //         await Product.updateOne({ _id: productId, storeId, user },{$set:{}},{});

  //     },
  //   },
};

module.exports = { ProductMutation };

// {"_id":ObjectId('6148c13dd8a716083a900941'),"storeId":ObjectId('6100fe565c67e215b6a8342a'),"user":ObjectId('6070ac01c581890a8177c12d')}
