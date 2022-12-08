const { ChatRoomQuery } = require("./chatRoomQ");
const { MessageQuery } = require("./messageQ");
const { StoreQuery } = require("./storeQ");
const { ProductQuery } = require("./productQ");
const { NotificationQuery } = require("./notificationQ");
const { CartCheckoutQuery } = require("./cartCheckoutQ");
const { OrderQuery } = require("./orderQ");
const { UserQuery } = require("./userQ");
const { CategoryQuery } = require("./categoryQ");

const RootQuery = {
  ...ChatRoomQuery,
  ...MessageQuery,
  ...StoreQuery,
  ...ProductQuery,
  ...NotificationQuery,
  ...CartCheckoutQuery,
  ...UserQuery,
  ...OrderQuery,
  ...CategoryQuery,
};

module.exports = {
  RootQuery,
};
