const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const { UserTC } = require("./userModel");
const { OrderTC } = require("./orderModal");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      // required: true,
    },

    title: {
      type: String,
    },
  },
  { timestamps: true }
);

notificationSchema.index({
  recipient: 1,
});
notificationSchema.index({
  order: 1,
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

schemaComposer.delete("Notification");

const NotificationTC = composeMongoose(Notification, {});

NotificationTC.addRelation("recipient", {
  resolver: () => UserTC.mongooseResolvers.findByIds({ lean: true }),
  prepareArgs: { _ids: source => source.recipient || [] },
  projection: { recipient: true },
});

NotificationTC.addRelation("order", {
  resolver: () => OrderTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: source => source.order },
  projection: { order: true },
});

UserTC.addFields({
  myNotifications: {
    type: [NotificationTC],
    resolve: async (source, args, ctx, info) => await Notification.find({ recipient: source._id }).lean(),
  },
});

module.exports = { Notification, NotificationTC };

// function adminAccess(resolvers) {
//   Object.keys(resolvers).forEach((k) => {
//     resolvers[k] = resolvers[k].wrapResolve(next => async rp => {

//       // extend resolve params with hook
//       rp.beforeRecordMutate = async function(doc, rp) {  }
//       return next(rp)
//     })
//   })
//   return resolvers
// };

// postAdded: {
//   type: Post,
//   subscribe: (_, __, { pubsub }) => {
//     console.log("pubsub", pubsub);
//     return pubsub.asyncIterator("postAdded");
//   },
// },

// createPost: {
//   type: Post,
//   args: {
//     title: { type: new GraphQLNonNull(GraphQLString) },
//     body: { type: new GraphQLNonNull(GraphQLString) },
//   },
//   resolve: (_, { title, body }, { req, res, pubsub }) => {
//     console.log("user", req.cookies, pubsub);
//     const { user } = req.cookies;
//     if (!user) {
//       throw new GraphQLError("Not Authorized");
//     }
//     pubsub.publish("postAdded", {
//       postAdded: {
//         title,
//         body,
//       },
//     });

//     return { title, body };
//   },
// },
