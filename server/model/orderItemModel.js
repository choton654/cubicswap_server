const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");

const OrderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    orderStatus: {
      type: String,
      enum: ["asked", "ordered", "placed", "dispatched", "delivered", "cancelled"],
      default: "asked",
    },
    quantity: { type: Number, required: true },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Store",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    rangePreUnitIdx: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

OrderItemSchema.index({
  user: 1,
});
OrderItemSchema.index({
  createdAt: 1,
});

const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", OrderItemSchema);

schemaComposer.delete("OrderItem");

const OrderItemTC = composeMongoose(OrderItem, {});

module.exports = { OrderItem, OrderItemTC };
