const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { UserTC } = require("./userModel");
const { schemaComposer } = require("graphql-compose");

const chatRoomUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const ChatRoomUser =
  mongoose.models.ChatRoomUser ||
  mongoose.model("ChatRoomUser", chatRoomUserSchema);

schemaComposer.delete("ChatRoomUser");

const ChatRoomUserTC = composeMongoose(ChatRoomUser, {});

ChatRoomUserTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.user },
  projection: { user: true },
});

module.exports = { ChatRoomUser, ChatRoomUserTC };
