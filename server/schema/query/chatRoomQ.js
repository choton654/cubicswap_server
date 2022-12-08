const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLError,
  GraphQLList,
} = require("graphql");
const { ChatRoomTC, ChatRoom } = require("../../model/chatRoomModel");
const {
  ChatRoomUser,
  ChatRoomUserTC,
} = require("../../model/chatRoomUserModel");

const ChatRoomQuery = {
  getMyUsers: {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(ChatRoomTC.getType()))
    ),
    args: {
      chatroomUserId: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (source, { chatroomUserId }, { req }, info) => {
      const { user } = req;

      if (!user) {
        throw new GraphQLError("You are not authenticate");
      }

      try {
        const ChatRoomUsers = await ChatRoomUser.find({
          user: chatroomUserId,
        }).lean();

        const chatRoomUserIds = ChatRoomUsers.map((c) => c._id);

        const ChatRooms = await ChatRoom.find({
          chatRoomUsers: { $all: [chatRoomUserIds] },
        })
          .lean()
          .sort({ createdAt: -1 });

        return ChatRooms;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("no chatroom found");
      }
    },
  },

  getChatRooms: ChatRoomTC.mongooseResolvers
    .findMany({
      filter: true,
      lean: true,
      limit: true,
      skip: true,
      sort: true,
    })
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      return next(rp);
    }),

  getChatRoom: {
    type: new GraphQLNonNull(ChatRoomTC.getType()),
    args: {
      // sellerId: { type: new GraphQLNonNull(GraphQLString) },
      // userId: { type: new GraphQLNonNull(GraphQLString) },
      chatRoomName: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (source, { chatRoomName }, { req }, info) => {
      const { user } = req;

      if (!user) {
        throw new GraphQLError("You are not authenticate");
      }

      // const chatRoomName = `${sellerId}-${userId}`;
      try {
        const chatroom = await ChatRoom.findOne({ name: chatRoomName }).lean();
        return chatroom;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("no chatroom found");
      }
    },
  },
};

module.exports = { ChatRoomQuery };
