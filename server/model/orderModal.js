const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const { ProductTC } = require("./productModel");
const { OrderItemTC, OrderItem } = require("./orderItemModel");
const { StoreTC, Store } = require("./storeModel");
const { UserTC } = require("./userModel");

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    // orderId: {
    //   type: String,
    //   required: true,
    //   default: nanoid(),
    // },
    // orderItems: {
    //   type: [orderItemsSchema],
    // },
    orderItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "OrderItem",
      },
    ],
    shippingAddress: {
      city: { type: String, required: true },
      pinCode: { type: String, required: true },
      state: { type: String, required: true },
      houseNo: { type: String, required: true },
      roadName: { type: String, required: true },
      landmark: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  user: 1,
});
orderSchema.index({
  createdAt: 1,
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

schemaComposer.delete("Order");
const OrderTC = composeMongoose(Order);

OrderTC.addRelation("orderItems", {
  resolver: () =>
    OrderItemTC.mongooseResolvers.findMany({
      lean: true,
      // filter: { isRequired: true, requiredFields: ["storeId"] },
    }),
  prepareArgs: {
    filter: source => ({
      _operators: {
        _id: { in: source.orderItems },
      },
    }),
  },
  projection: { orderItems: 1 },
});

OrderTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.user },

  projection: { user: true },
});

OrderItemTC.addRelation("orderId", {
  resolver: () => OrderTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.orderId },
  projection: { orderId: true },
});

OrderItemTC.addRelation("product", {
  resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.product },
  projection: { product: true },
});

OrderItemTC.addRelation("storeId", {
  resolver: () => StoreTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.storeId },
  projection: { storeId: true },
});

// OrderTC.addFields({
//   recivedOrders: {
//     type: [OrderItemTC.getType()],
//     args: {
//       userId: "MongoID!",
//     },
//     resolve: async (source, { userId }, { req }, info) => {
//       if (!req.user) {
//         throw new GraphQLError("You are not authenticate");
//       }
//       if (req.user.role !== "seller") {
//         throw new GraphQLError("You are not authorize in this route");
//       }
//       if (req.user._id.toString() !== userId.toString()) {
//         throw new GraphQLError("You are not authorize");
//       }

//       try {
//         const store = await Store.findOne({ owner: userId }).lean();
//         const ordetItems = await OrderItem.find({ storeId: store._id }).lean();
//         return ordetItems;
//       } catch (error) {
//         console.error(error);
//         throw new GraphQLError("No orders found");
//       }
//     },
//   },
// });

module.exports = { OrderTC, Order };

// const orderItemsSchema = mongoose.Schema({
//   productOwner: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "User",
//   },
//   orderStatus: {
//     type: String,
//     enum: ["ordered", "placed", "dispatched", "delivered", "cancelled"],
//     default: "ordered",
//   },
//   quantity: { type: Number, required: true },
//   storeId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "Store",
//   },
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "Product",
//   },
//   rangePreUnitIdx: {
//     type: Number,
//     default: 0,
//   },
// });

// const OrderItemsTC = OrderTC.getFieldOTC("orderItems");

// OrderTC.addFields({
//   recivedOrders: {
//     type: [OrderItemsTC], // array of Posts
//     args: {
//       // storeId: "MongoID!",
//       userId: "MongoID!",
//     },
//     resolve: async (source, { userId }, { req }, info) => {
//       if (!req.user) {
//         throw new GraphQLError("You are not authenticate");
//       }
//       if (req.user.role !== "seller") {
//         throw new GraphQLError("You are not authorize in this route");
//       }

//       const order = await Order.findById(source._id)
//         .lean()
//         .populate("orderItems.product")
//         .populate("user");

//       return order.orderItems.filter(
//         (o, i) => o?.product?.user?.toString() === userId.toString()
//       );
//     },
//   },
// });

// OrderItemsTC.addRelation("productOwner", {
//   resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
//   prepareArgs: { _id: (source) => source.productOwner },
//   projection: { productOwner: true },
// });

// OrderItemsTC.addRelation("storeId", {
//   resolver: () => StoreTC.mongooseResolvers.findById({ lean: true }),
//   prepareArgs: { _id: (source) => source.storeId },
//   projection: { storeId: true },
// });

// OrderItemsTC.addRelation("product", {
//   resolver: () => ProductTC.mongooseResolvers.findById({ lean: true }),
//   prepareArgs: { _id: (source) => source.product },
//   projection: { product: true },
// });

// findmanyOrderItems: OrderItemsTC.getResolver("findMany"),

// OrderItemsTC.addResolver({
//   name: "findMany",
//   args: {
//     orderId: new GraphQLNonNull(GraphQLString),
//     userId: new GraphQLNonNull(GraphQLString),
//   },
//   type: [OrderItemsTC],
//   resolve: async ({ source, args: { orderId, userId } }) => {
//     console.log(orderId, userId);
//     const orders = await Order.findOne({ _id: orderId.toString() });
//     const items = await Order.findById(orderId.toString()).orderItems.filter(
//       (o, i) => o?.product?.user?.toString() === userId.toString()
//     );

//     console.log("orders", orders);
//     return items;
//   },
// });

// OrderTC.addResolver({
//   name: "findById",
//   args: { orderId: new GraphQLNonNull(GraphQLString) },
//   type: [OrderItemsTC],
//   resolve: async (source, args) => {
//     return await Order.findById(args.orderId.toString());
//   },
// });
