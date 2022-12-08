const { CategoryTC } = require("../../model/categoryModel");
const { NotificationTC } = require("../../model/notificationModel");
const { ChatRoomUserTC } = require("../../model/chatRoomUserModel");
const { ChatRoomMutation } = require("./chatRoomM");
const { MessageMutation } = require("./messageM");
const { StoreMutation } = require("./storeM");
const { ProductMutation } = require("./productM");
const { CartCheckoutMutation } = require("./cartCheckoutM");
const { OrderMutation } = require("./orderM");
const { CategoryMutation } = require("./categoryM");
const { UserMutation } = require("./userM");

const RootMutation = {
  ...MessageMutation,
  ...ChatRoomMutation,
  ...StoreMutation,
  ...ProductMutation,
  ...CartCheckoutMutation,
  ...OrderMutation,
  ...CategoryMutation,
  ...UserMutation,
  addChatRoomUser: ChatRoomUserTC.mongooseResolvers.createOne(),
  notificationRemoveOne: NotificationTC.mongooseResolvers.removeOne(),
  addCategory: CategoryTC.mongooseResolvers.createOne(),
  createCat: {
    type: CategoryTC,
    args: {
      name: "String!",
    },
    resolve: async ({ source, args, context, info }) => {
      return await Category.create({
        name: args.name,
      });
    },
  },
};

module.exports = { RootMutation };
