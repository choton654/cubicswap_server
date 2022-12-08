const { GraphQLError, GraphQLNonNull, GraphQLList } = require("graphql");
const { OrderItemTC, OrderItem } = require("../../model/orderItemModel");
const { OrderTC, Order } = require("../../model/orderModal");
const mongoose = require("mongoose");

const OrderQuery = {
  getMyOrders: OrderTC.mongooseResolvers
    .pagination({
      findManyOpts: {
        lean: true,
        filter: {
          isRequired: true,
          requiredFields: ["user"],
        },
      },
    })
    .wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }

      if (rp.args.filter.user.toString() !== rp.context.req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }
      rp.args.filter.user = rp.context.req.user._id;

      return next(rp);
    }),

  getOneOrder: OrderTC.mongooseResolvers
    .findOne({
      lean: true,
      filter: {
        isRequired: true,
        requiredFields: ["user", "_id"],
      },
    })
    .wrapResolve(next => async rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }

      if (rp.args.filter.user.toString() !== rp.context.req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }
      rp.args.filter.user = rp.context.req.user._id;

      return next(rp);
    }),

  getOrderItemsByStore: OrderItemTC.mongooseResolvers
    .pagination({
      findManyOpts: {
        lean: true,
        filter: {
          isRequired: true,
          requiredFields: ["storeId"],
        },
      },
    })
    .wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }
      if (rp.context.req.user.role === "user") {
        throw new GraphQLError("Not Authorize");
      }

      // if (
      //   rp.args.filter.storeId.toString() !==
      //   rp.context.req.user.storeId.toString()
      // ) {
      //   throw new GraphQLError("Not Authorized");
      // }
      // rp.args.filter.storeId = rp.context.req.user.storeId;

      return next(rp);
    }),

  getAllOrders: OrderTC.mongooseResolvers
    .pagination({
      findManyOpts: {
        lean: true,
      },
    })
    .wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }
      if (rp.context.req.user.role !== "admin") {
        throw new GraphQLError("Not Authorize");
      }

      // if (
      //   rp.args.filter.storeId.toString() !==
      //   rp.context.req.user.storeId.toString()
      // ) {
      //   throw new GraphQLError("Not Authorized");
      // }
      // rp.args.filter.storeId = rp.context.req.user.storeId;

      return next(rp);
    }),
};

module.exports = { OrderQuery };

// getOneOrder: {
//   type: new GraphQLNonNull(OrderTC.getType()),
//   args: {
//     user: "MongoID!",
//     orderId: "String!",
//   },

//   resolve: async (source, { user, orderId }, { req }) => {
//     if (!req.user) {
//       throw new GraphQLError("Not Authenticate");
//     }

//     if (user.toString() !== req.user._id.toString()) {
//       throw new GraphQLError("Not Authorized");
//     }

//     try {
//       const order = await Order.findOne({ user, orderId }).lean();
//       console.log(order);
//       if (!order) {
//         throw new GraphQLError("No order found");
//       }
//       return order;
//     } catch (error) {
//       console.error(error);
//       throw new GraphQLError("Something went wrong");
//     }
//   },
// },

// getOrdersByStore: {
//   type: new GraphQLList(new GraphQLNonNull(OrderItemTC.getType())),
//   args: {
//     storeId: "MongoID!",
//     user: "MongoID!",
//   },

//   resolve: async (source, { user, storeId }, { req }) => {
//     if (!req.user) {
//       throw new GraphQLError("Not Authenticate");
//     }

//     if (user.toString() !== req.user._id.toString()) {
//       throw new GraphQLError("Not Authorized");
//     }
//     try {
//       const orderItems = await OrderItem.find({
//         storeId,
//       }).lean();
//       console.log(orderItems);
//       if (!orderItems) {
//         throw new GraphQLError("No orderItems found");
//       }
//       return orderItems;
//     } catch (error) {
//       console.error(error);
//       throw new GraphQLError("Something went wrong");
//     }
//   },
// },
