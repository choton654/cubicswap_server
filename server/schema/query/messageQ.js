const { GraphQLString, GraphQLNonNull, GraphQLList, GraphQLError, GraphQLInt } = require("graphql");
const { ChatRoomTC, ChatRoom } = require("../../model/chatRoomModel");
const { Message, MessageTC } = require("../../model/messageModel");
const { QueryTC } = require("../../model/queryModel");

const MessageQuery = {
  getMessages: {
    type: new GraphQLList(MessageTC.getType()),
    args: {
      chatRoomId: { type: new GraphQLNonNull(GraphQLString) },
      offset: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve: async (source, { chatRoomId, offset }, { req }, info) => {
      const { user } = req;

      if (!user) {
        throw new GraphQLError("You are not authenticate");
      }

      try {
        const chatroom = await ChatRoom.findById(chatRoomId).lean();
        if (!chatroom) {
          throw new GraphQLError("no chatroom found");
        }
        return await Message.find({ chatRoom: chatroom._id }).limit(10).skip(offset).sort({ createdAt: -1 });
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  },

  getProductQuery: QueryTC.mongooseResolvers.pagination({
    lean: true,
    findManyOpts: {
      filter: {
        operators: true,
      },
    },
    // filter: {
    //   isRequired: true,
    //   requiredFields: ["productId"],
    // },
  }),
};

module.exports = { MessageQuery };
