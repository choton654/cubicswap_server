const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const { ChatRoomUserTC } = require("./chatRoomUserModel");
const { MessageTC } = require("./messageModel");

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    chatRoomUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoomUser",
      },
    ],
    lastmessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({
  user: 1,
});

chatRoomSchema.index({
  name: 1,
});

const ChatRoom =
  mongoose.models.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);

schemaComposer.delete("ChatRoom");

const ChatRoomTC = composeMongoose(ChatRoom, {});

ChatRoomTC.addRelation("chatRoomUsers", {
  resolver: () => ChatRoomUserTC.mongooseResolvers.findByIds({ lean: true }),
  prepareArgs: { _ids: (source) => source.chatRoomUsers },
  projection: { chatRoomUsers: true },
});

ChatRoomTC.addRelation("messages", {
  resolver: () => MessageTC.mongooseResolvers.findByIds({ lean: true }),
  prepareArgs: { _ids: (source) => source.messages },
  projection: { messages: true },
});

ChatRoomTC.addRelation("lastmessage", {
  resolver: () => MessageTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.lastmessage },
  projection: { lastmessage: true },
});

MessageTC.addRelation("chatRoom", {
  resolver: () => ChatRoomTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.chatRoom },
  projection: { chatRoom: true },
});

ChatRoomUserTC.addRelation("chatRooms", {
  resolver: () => ChatRoomTC.mongooseResolvers.findByIds({ lean: true }),
  prepareArgs: { _ids: (source) => source.chatRooms },
  projection: { chatRooms: true },
});

module.exports = { ChatRoom, ChatRoomTC };
