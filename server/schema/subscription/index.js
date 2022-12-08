const { GraphQLNonNull, GraphQLString } = require("graphql");
const { withFilter } = require("graphql-subscriptions");
const { pubsub } = require("../../context");
const { NotificationTC } = require("../../model/notificationModel");
const { MessageSubscription } = require("./messageS");

const RootSub = {
  ...MessageSubscription,
  notificationSub: {
    type: NotificationTC.getType(),
    args: {
      recipient: { type: new GraphQLNonNull(GraphQLString) },
    },
    subscribe: withFilter(
      () => pubsub.asyncIterator("createNotification"),

      (payload, args, ctx) => {
        return payload.createNotification.recipient.includes(args.recipient);
      }
    ),
  },
};

module.exports = { RootSub };

// {
//       console.log(pubsub);
//       return pubsub.asyncIterator("createNotification");
//     },
