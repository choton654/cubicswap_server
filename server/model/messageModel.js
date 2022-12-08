const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { UserTC } = require("./userModel");
const { schemaComposer } = require("graphql-compose");

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
  },
  { timestamps: true }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

schemaComposer.delete("Message");

const MessageTC = composeMongoose(Message, {});

MessageTC.addRelation("user", {
  resolver: () => UserTC.mongooseResolvers.findById({ lean: true }),
  prepareArgs: { _id: (source) => source.user },
  projection: { user: true },
});

module.exports = { Message, MessageTC };
