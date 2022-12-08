const { MessageTC } = require("../../model/messageModel");
const { ChatRoomTC } = require("../../model/chatRoomModel");
const {
  GraphQLNonNull,
  GraphQLString,
  GraphQLError,
  GraphQLBoolean,
} = require("graphql");

const { withFilter } = require("graphql-subscriptions");
const { pubsub } = require("../../context");

const MessageSubscription = {
  createMsgSub: {
    type: new GraphQLNonNull(MessageTC.getType()),
    args: {
      chatRoomId: { type: new GraphQLNonNull(GraphQLString) },
    },
    subscribe: withFilter(
      () => pubsub.asyncIterator("createMessage"),

      (payload, args, ctx) => {
        const hasChatRoom =
          payload.chatRoom.toString() === args.chatRoomId.toString();

        return hasChatRoom;
      }
    ),
  },

  typeMsgSub: {
    type: GraphQLBoolean,
    args: {
      chatRoomId: { type: new GraphQLNonNull(GraphQLString) },
      typerId: { type: new GraphQLNonNull(GraphQLString) },
    },
    subscribe: withFilter(
      () => pubsub.asyncIterator("typing"),

      (payload, args, ctx) => {
        const isTyping =
          payload.chatRoomId.toString() === args.chatRoomId.toString() &&
          payload.typerId.toString() === args.typerId.toString();

        return isTyping;
      }
    ),
  },

  // createChatRoomSub: {
  //   type: new GraphQLNonNull(ChatRoomTC.getType()),
  //   args: {
  //     userRole: { type: new GraphQLNonNull(GraphQLString) },
  //   },
  //   subscribe: (_, { userRole }, { pubsub }) => {
  //     if (userRole !== "seller") {
  //       throw new GraphQLError("Not authorize");
  //     }
  //     return pubsub.asyncIterator("createChatRoom");
  //   },
  // },
};

module.exports = { MessageSubscription };
