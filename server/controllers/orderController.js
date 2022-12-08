const asyncHandler = require("express-async-handler");
const { Order } = require("../model/orderModal");
const mongoose = require("mongoose");
const { Cart } = require("../model/cartModel");
const { Checkout } = require("../model/checkoutModal");
// const axios = require("axios");
const { User } = require("../model/userModel");
// const { pubsub } = require("../context");
const { Notification } = require("../model/notificationModel");
const { OrderItem } = require("../model/orderItemModel");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { shippingAddress, totalPrice, checkoutItems } = req.body;

  if (
    (checkoutItems && checkoutItems.length === 0) ||
    !totalPrice ||
    !shippingAddress
  ) {
    return res
      .status(400)
      .json({ success: false, msg: "Required field missing" });
  }
  try {
    const prodOwnersToSendNotification = [
      ...new Set(checkoutItems.map((item) => item.product.user._id)),
    ];

    const registrationTokens = await User.find({
      _id: prodOwnersToSendNotification,
    })
      .lean()
      .select({ fcmToken: 1, _id: 1 });

    // const notify = prodOwnersToSendNotification.map((p) => ({
    //   name: p,
    //   products: checkoutItems.map((item) =>
    //   item.product.user._id === p ? item.product.name : null
    //   ),
    // }));

    // console.log(
    //   "push-notification",
    //   prodOwnersToSendNotification,
    //   registrationTokens,
    //   notify
    //   );

    // const productsToNotify = checkoutItems.map((item) => item.product.name);
    // const orderItems = checkoutItems.map((item) => ({
    //   productOwner: mongoose.Types.ObjectId(item.product.user),
    //   storeId: mongoose.Types.ObjectId(item.product.storeId),
    //   product: mongoose.Types.ObjectId(item.product._id),
    //   quantity: item.product.quantity,
    //   rangePreUnitIdx: item.product.rangePreUnitIdx,
    // }));

    // This registration token comes from the client FCM SDKs.

    // for legacy api

    //  send notification to seller

    // await axios.post(
    //   "https://fcm.googleapis.com/fcm/send",
    //   {
    //     registration_ids: registrationTokens.map((t) => t.fcmToken),
    //     notification: {
    //       title: "Good news",
    //       body: "Someone ordered your product",
    //       click_action: `${process.env.BASE_URL}/notification`,
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `key=${process.env.SERVER_KEY}`,
    //     },
    //   }
    // );

    //  send notification to user

    // const { data } = await axios.post(
    //   "https://fcm.googleapis.com/fcm/send",
    //   {
    //     registration_ids: [req.user.fcmToken.toString()],
    //     notification: {
    //       title: "Good news",
    //       body: "We have successfully created a order for you",
    //       click_action: `${process.env.BASE_URL}/orderSummery`,
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `key=${process.env.SERVER_KEY}`,
    //     },
    //   }
    // );

    // console.log(data);

    const order = await Order.create({
      user: req.user._id,
      shippingAddress,
      totalPrice,
    });

    const orderItems = await Promise.all(
      checkoutItems.map((item) =>
        OrderItem.create({
          orderId: mongoose.Types.ObjectId(order._id),
          storeId: mongoose.Types.ObjectId(item.product.storeId._id),
          product: mongoose.Types.ObjectId(item.product._id),
          quantity: item.quantity,
          rangePreUnitIdx: item.rangePreUnitIdx,
        })
      )
    );

    console.log("order-items", orderItems);
    const newOrder = await Order.updateOne(
      { _id: order._id },
      { $set: { orderItems: orderItems.map((o) => o._id) } }
    );

    await Promise.all(
      [
        req.user._id.toString(),
        ...registrationTokens.map((t) => t._id.toString()),
      ].map((id) =>
        Notification.create({
          recipient: id,
          order: order._id,
        })
      )
    );

    await Cart.findOneAndUpdate({ user: req.user._id }, { products: [] });
    await Checkout.findOneAndUpdate(
      {
        user: req.user._id,
      },
      { products: [] }
    );

    // pubsub.publish("createNotification", {
    //   createNotification: {
    //     recipient: [
    //       req.user._id.toString(),
    //       ...registrationTokens.map((t) => t._id.toString()),
    //     ],
    //     order: order._id,
    //   },
    // });

    return res.status(200).json({
      success: true,
      msg: "order create successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!!" });
  }
});

// @desc    Get order by ID
// @route   POST /api/orders/singelorder
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, msg: "required field missing" });
  }
  try {
    // const order = await Order.findOne({
    //   _id: orderId,
    // })
    //   .lean()
    //   .select({ orderItems: 1, shippingAddress: 1 })
    //   .populate("orderItems.product", "name category image price");

    const order = await Order.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(orderId) } },

      {
        $project: {
          orderItems: 1,
          shippingAddress: 1,
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          let: {
            product_id: "$orderItems.product",
            // product_owner: "$orderItems.productOwner",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$product_id"] },
              },
            },
            {
              $project: {
                name: 1,
                images: 1,
                category: 1,
                price: 1,
                brand: 1,
                rangePerUnit: 1,
              },
            },
          ],
          as: "products",
        },
      },
    ]);

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "can not get order" });
  }
});

// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const { pageNumber } = req.query;

  const pageSize = 10;
  const page = Number(pageNumber) || 1;

  let findObj = { user: req.user._id };
  if (req.user.role === "seller") {
    findObj = {
      user: mongoose.Types.ObjectId(req.user._id),
      orderItems: { $nin: [mongoose.Types.ObjectId(req.user._id)] },
    };
  }
  try {
    const count = await Order.countDocuments(findObj);

    // const orders = await Order.find(findObj)
    //   .lean()
    //   .limit(pageSize)
    //   .skip(pageSize * (page - 1))
    //   .select({ orderItems: 1 })
    //   .sort({ createdAt: -1 })
    //   .populate({
    //     path: "orderItems.product",
    //     select: "name image",
    //   });

    const orders = await Order.aggregate([
      { $match: findObj },
      {
        $project: {
          orderItems: 1,
          _id: 1,
          createdAt: 1,
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          let: {
            product_id: "$orderItems.product",
            // product_owner: "$orderItems.productOwner",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$product_id"] },
              },
            },
            { $project: { name: 1, images: 1 } },
          ],
          as: "products",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
      // {
      //   $facet: {
      //     metadata: [
      //       {
      //         $group: {
      //           _id: null,
      //           total: { $sum: 1 },
      //         },
      //       },
      //     ],
      //     data: [
      //       { $sort: { createdAt: -1 } },
      //       { $skip: pageSize * (page - 1) },
      //       { $limit: pageSize },
      //     ],
      //   },
      // },
      // {
      //   $project: {
      //     data: 1,
      //     // Get total from the first element of the metadata array
      //     total: { $arrayElemAt: ["$metadata.total", 0] },
      //   },
      // },
    ]);

    return res.status(200).json({
      success: true,
      orders,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id name");
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

// @desc    Get all orders
// @route   GET /api/orders/receivedOrders
// @access  Private/seller
const getReceivedOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== "seller") {
    return res.status(404).json({ success: false, msg: "not authorize" });
  }
  try {
    // const receivedOrders = await Order.find(
    //   { "orderItems.productOwner": mongoose.Types.ObjectId(req.user._id) },
    //   { "orderItems.$": 1, shippingAddress: 1 }
    // )
    //   .lean()
    //   .populate("orderItems.product", "name category image price")
    //   .populate("user", "name");

    // <<<<<<<< or >>>>>>>>>

    // receivedOrders = await Order.find(
    //   { "orderItems.productOwner": mongoose.Types.ObjectId(req.user._id) },
    //   {
    //     _id: 0,
    //     orderItems: {
    //       $elemMatch: { productOwner: mongoose.Types.ObjectId(req.user._id) },
    //     },
    //   }
    // ).populate("orderItems.product");

    // <<<<<<<< or >>>>>>>>>

    const receivedOrders = await Order.aggregate([
      {
        $match: {
          "orderItems.productOwner": mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $project: {
          orderItems: {
            $filter: {
              input: "$orderItems",
              as: "orderItem",
              cond: {
                $eq: [
                  "$$orderItem.productOwner",
                  mongoose.Types.ObjectId(req.user._id),
                ],
              },
            },
          },
          user: 1,
          shippingAddress: 1,
          _id: 1,
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          let: {
            product_id: "$orderItems.product",
            // product_owner: "$orderItems.productOwner",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$product_id"] },
              },
            },
            // {
            //   $lookup: {
            //     from: "users",
            //     let: {
            //       user_id: "$user",
            //     },
            //     pipeline: [
            //       {
            //         $match: {
            //           $expr: { $eq: ["$_id", "$$user_id"] },
            //         },
            //       },
            //       { $project: { name: 1, phone: 1 } },
            //     ],
            //     as: "user",
            //   },
            // },
            {
              $project: {
                name: 1,
                category: 1,
                images: 1,
                price: 1,
                // user: 1,
              },
            },
          ],
          as: "products",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: 10 * (1 - 1) },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          let: {
            user_id: "$user",
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
            { $project: { name: 1, phone: 1 } },
          ],
          as: "user",
        },
      },
    ]);

    return res.status(200).json({ success: true, receivedOrders });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "something went wrong!" });
  }
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  getReceivedOrders,
};

// const { google } = require("googleapis");

// for http/v1/api

// function getAccessToken() {
//   return new Promise(function (resolve, reject) {
//     const key = require("../../start-up-c1e7b-firebase-adminsdk-srmu2-67ca592fff.json");
//     const jwtClient = new google.auth.JWT(
//       key.client_email,
//       null,
//       key.private_key,
//       "https://www.googleapis.com/auth/firebase.messaging",
//       null
//     );
//     jwtClient.authorize(function (err, tokens) {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(tokens.access_token);
//     });
//   });
// }

// const token = await getAccessToken();

// const { data } = await axios.post(
//   "https://fcm.googleapis.com/v1/projects/start-up-c1e7b/messages:send",
//   {
//     message,
//   },
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
// );
