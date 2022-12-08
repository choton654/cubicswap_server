const { MessageTC, Message } = require("../../model/messageModel");
const { GraphQLNonNull, GraphQLError, GraphQLBoolean } = require("graphql");
const { User } = require("../../model/userModel");
const { ChatRoom } = require("../../model/chatRoomModel");
const { pubsub } = require("../../context");
const { QueryTC, Query } = require("../../model/queryModel");
const { beamsClient } = require("../../utils/bemsClient");
const { Store } = require("../../model/storeModel");
const { Product } = require("../../model/productModel");
const { BASE_URL } = require("../../utils/baseUrl");

const MessageMutation = {
  createMessage: {
    type: GraphQLBoolean,
    args: {
      content: "String!",
      chatRoom: "String!",
    },
    resolve: async (source, args, { req }, info) => {
      try {
        if (!req.user) {
          throw new GraphQLError("Not Authorized");
        }

        const user = await User.findOne({ _id: req.user._id }).lean();

        const message = await Message.create({
          content: args.content,
          chatRoom: args.chatRoom,
          user: user._id,
        });

        await ChatRoom.updateOne(
          { _id: args.chatRoom },
          {
            $set: {
              lastmessage: message._id,
            },
          }
        );

        pubsub.publish("createMessage", {
          chatRoom: message.chatRoom,
          createMsgSub: {
            user: message.user,
            content: message.content,
            chatRoom: message.chatRoom,
            _id: message._id,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          },
        });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  },

  typeMsg: {
    type: GraphQLBoolean,
    args: {
      chatRoomId: "String!",
      typerId: "String!",
      istype: "Boolean!",
    },
    resolve: async (source, { istype, chatRoomId, typerId }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not Authorized");
      }

      if (typerId.toString() !== req.user._id.toString()) {
        return false;
      }
      if (istype) {
        pubsub.publish("typing", {
          chatRoomId,
          typerId,
          typeMsgSub: true,
        });

        return true;
      }

      pubsub.publish("typing", {
        chatRoomId,
        typerId,
        typeMsgSub: false,
      });

      return false;
    },
  },

  addQuery: QueryTC.mongooseResolvers
    .createOne({
      record: {
        isRequired: true,
        requiredFields: ["content", "productId", "storeId", "userId"],
      },
    })
    .setResolve(async ({ source, args, context, info, projection }) => {
      const {
        record: { content, productId, storeId, userId },
      } = args;

      try {
        const [newQuery, user, store, product] = await Promise.all([
          Query.create({ content, productId, storeId, userId }),
          User.findOne({ _id: userId }, { name: 1 }),
          Store.findOne({ _id: storeId }, { owner: 1 }),
          Product.findOne({ _id: productId }, { name: 1, images: { $slice: 1 } }),
        ]);

        // const newQuery = await Query.create({ content, productId, storeId, userId });
        // const user = await User.findOne({ _id: userId }, { name: 1 });
        // const store = await Store.findOne({ _id: storeId }, { owner: 1 });
        // const product = await Product.findOne({ _id: productId }, { name: 1, images: { $slice: 1 } });

        await beamsClient.publishToUsers([store.owner.toString()], {
          web: {
            notification: {
              title: "Cubicswap",
              body: `${user.name} wants to know about ${product.name}`,
              icon: product.images[0],
              deep_link: `${BASE_URL}/profile/myStore/${storeId}/queries`,
            },
          },
        });
        return newQuery;
      } catch (error) {
        console.error(error);
      }
    })
    .wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      if (rp.context.req.user.role !== "user") {
        throw new GraphQLError("Not Authorized in this route");
      }
      return next(rp);
    }),

  replyQuery: QueryTC.mongooseResolvers
    .updateOne({
      filter: {
        isRequired: true,
        requiredFields: ["_id", "storeId"],
      },
      record: {
        isRequired: true,
        requiredFields: ["replies"],
      },
    })
    .wrapResolve(next => rp => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      if (rp.context.req.user.role !== "seller") {
        throw new GraphQLError("Not Authorized in this route");
      }
      return next(rp);
    }),
};

module.exports = { MessageMutation };
