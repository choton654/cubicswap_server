const { GraphQLNonNull, GraphQLError, GraphQLString } = require("graphql");
const mongoose = require("mongoose");
const { toInputObjectType } = require("graphql-compose");
const { Cart } = require("../../model/cartModel");
const { Checkout, CheckoutItemTC } = require("../../model/checkoutModal");
const { OrderItem } = require("../../model/orderItemModel");
const { Product } = require("../../model/productModel");
const { Notification } = require("../../model/notificationModel");
const { OrderTC, Order } = require("../../model/orderModal");
const { UserShippingAddressTC, User } = require("../../model/userModel");
const { beamsClient } = require("../../utils/bemsClient");
const { BASE_URL } = require("../../utils/baseUrl");

const mergeArrayObjects = (arr1, arr2) => {
  return arr1.map((item, i) => {
    return Object.assign({}, item, { storeId: arr2[i] });
  });
};

const OrderMutation = {
  createOrder: {
    type: OrderTC.NonNull,
    args: {
      totalPrice: new GraphQLNonNull(GraphQLString),
      shippingAddress: toInputObjectType(
        // schemaComposer.getAnyTC("UserShippingAddress")
        UserShippingAddressTC
      ),
      checkoutItems: [
        toInputObjectType(
          // schemaComposer.getAnyTC("CheckoutItem")
          CheckoutItemTC
        ),
      ],
      prodOwnerIds: `[String]!`,
      storeIds: `[String]!`,
    },
    resolve: async (
      source,
      { shippingAddress, totalPrice, checkoutItems, prodOwnerIds, storeIds },
      { req },
      info
    ) => {
      if (!req.user) {
        throw new GraphQLError("Not authenticate");
      }
      if (req.user.role !== "user") {
        throw new GraphQLError("Not Authorised in this route");
      }

      try {
        const prodOwnersToSendNotification = [...new Set(prodOwnerIds.map(item => item))];
        const currDate = new Date().toLocaleString();

        const registrationTokens = await User.find({
          _id: prodOwnersToSendNotification,
        })
          .lean()
          .select({ fcmToken: 1, _id: 1 });

        const order = await Order.create({
          user: req.user._id,
          shippingAddress,
          totalPrice,
        });

        const productsName = await Product.find(
          { _id: checkoutItems.map(c => c.product) },
          { name: 1, images: { $slice: 1 } }
        );

        const orderItems = await Promise.all(
          [...mergeArrayObjects(checkoutItems, storeIds)].map(item =>
            OrderItem.create({
              orderId: mongoose.Types.ObjectId(order._id),
              storeId: mongoose.Types.ObjectId(item.storeId),
              product: mongoose.Types.ObjectId(item.product),
              quantity: item.quantity,
              rangePreUnitIdx: item.rangePreUnitIdx,
            })
          )
        );

        await Promise.all([
          Order.updateOne({ _id: order._id }, { $set: { orderItems: orderItems.map(o => o._id) } }),
          Notification.create({
            recipient: registrationTokens[0]._id,
            order: order._id,
            title: `${req.user.name} have asked for ${productsName[0].name}, total price ₹ ${totalPrice} INR, total quantity ${orderItems[0].quantity}, at ${currDate}`,
          }),
        ]);

        // Cart.findOneAndUpdate({ user: req.user._id }, { products: [] }),
        // Checkout.findOneAndUpdate(
        //   {
        //     user: req.user._id,
        //   },
        //   { products: [] }
        // ),

        await Promise.all([
          beamsClient.publishToUsers([registrationTokens[0]._id.toString()], {
            web: {
              notification: {
                title: "Cubicswap",
                body: `${req.user.name} have asked for ${productsName[0].name}, total price ₹ ${totalPrice}, total quentity ${orderItems[0].quantity}, at ${currDate}`,
                icon: productsName[0].images[0],
                deep_link: `${BASE_URL}/profile/myStore/${orderItems[0].storeId}/orderRecived`,
              },
            },
          }),
          beamsClient.publishToUsers([req.user._id.toString()], {
            web: {
              notification: {
                title: "Cubicswap",
                body: `You have asked for ${productsName[0].name}, total price ₹ ${totalPrice} INR, total quantity ${orderItems[0].quantity}, at ${currDate}`,
                icon: productsName[0].images[0],
                deep_link: `${BASE_URL}/orderSummery`,
              },
            },
          }),
        ]);

        return order;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("something went wrong!!");
      }
    },
  },
};

module.exports = { OrderMutation };
