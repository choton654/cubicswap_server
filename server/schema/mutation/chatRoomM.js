const {
  GraphQLString,
  GraphQLError,
  GraphQLBoolean,
  GraphQLNonNull,
} = require("graphql");
const { ChatRoomTC, ChatRoom } = require("../../model/chatRoomModel");
const {
  ChatRoomUser,
  ChatRoomUserTC,
} = require("../../model/chatRoomUserModel");

const ChatRoomMutation = {
  updateChatRoom: ChatRoomTC.mongooseResolvers.updateOne(),

  createChatRoom: {
    type: new GraphQLNonNull(ChatRoomTC.getType()),
    args: { sellerId: { type: new GraphQLNonNull(GraphQLString) } },
    resolve: async (source, { sellerId }, { req, pubsub }, info) => {
      const { user } = req;

      if (!user) {
        throw new GraphQLError("You are not authenticate");
      }

      if (sellerId === req.user._id.toString()) {
        throw new GraphQLError("Not Authorize");
      }

      let newChatRoomUserForUser, newChatRoomUserForSeller, newChatRoom;

      const userId = user._id.toString();

      const chatRoomName = `${sellerId}-${userId}`;

      try {
        const existingChatRoom = await ChatRoom.findOne({
          name: chatRoomName,
        }).lean();

        if (existingChatRoom) {
          console.log("exchat", existingChatRoom);
          return existingChatRoom;
        }

        newChatRoom = await ChatRoom.create({ name: chatRoomName });

        const [existingChatRoomUserForUser, existingChatRoomUserForSeller] =
          await Promise.all([
            ChatRoomUser.findOne({
              user: userId,
            }).lean(),

            ChatRoomUser.findOne({
              user: sellerId,
            }).lean(),
          ]);

        if (!existingChatRoomUserForUser) {
          newChatRoomUserForUser = await ChatRoomUser.create({
            user: userId,
            chatRooms: [newChatRoom._id],
          });

          await ChatRoom.updateOne(
            { name: newChatRoom.name },
            {
              $addToSet: {
                chatRoomUsers: {
                  $each: [newChatRoomUserForUser._id],
                },
              },
            }
          );
        } else {
          await Promise.all([
            ChatRoomUser.updateOne(
              { user: userId },
              {
                $addToSet: {
                  chatRooms: {
                    $each: [newChatRoom._id],
                  },
                },
              }
            ),
            ChatRoom.updateOne(
              { name: newChatRoom.name },
              {
                $addToSet: {
                  chatRoomUsers: {
                    $each: [existingChatRoomUserForUser._id],
                  },
                },
              }
            ),
          ]);
        }

        if (!existingChatRoomUserForSeller) {
          newChatRoomUserForSeller = await ChatRoomUser.create({
            user: sellerId,
            chatRooms: [newChatRoom._id],
          });

          await ChatRoom.updateOne(
            { name: newChatRoom.name },
            {
              $addToSet: {
                chatRoomUsers: {
                  $each: [newChatRoomUserForSeller._id],
                },
              },
            }
          );
        } else {
          await Promise.all([
            ChatRoomUser.updateOne(
              { user: sellerId },
              {
                $addToSet: {
                  chatRooms: {
                    $each: [newChatRoom._id],
                  },
                },
              }
            ),
            ChatRoom.updateOne(
              { name: newChatRoom.name },
              {
                $addToSet: {
                  chatRoomUsers: {
                    $each: [existingChatRoomUserForSeller._id],
                  },
                },
              }
            ),
          ]);
        }
        console.log("newhat", newChatRoom);
        return newChatRoom;

        // newChatRoom = await ChatRoom.findOne({
        //   name: chatRoomName,
        // }).lean();

        // console.log("new-chatroom", newChatRoom);

        // pubsub.publish("createChatRoom", {
        //   createChatRoomSub: {
        //     name: newChatRoom.name,
        //     chatRoomUsers: newChatRoom.chatRoomUsers,
        //     lastmessage: newChatRoom.lastmessage,
        //     _id: newChatRoom._id,
        //     createdAt: newChatRoom.createdAt,
        //     updatedAt: newChatRoom.updatedAt,
        //   },
        // });
      } catch (error) {
        console.error(error);
        throw new GraphQLError("Something went wrong!");
      }
    },
  },
};

module.exports = { ChatRoomMutation };
