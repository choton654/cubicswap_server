const {
  GraphQLString,
  GraphQLError,
  GraphQLBoolean,
  GraphQLNonNull,
} = require("graphql");
const { UserTC, User } = require("../../model/userModel");
const {
  ChatRoomUser,
  ChatRoomUserTC,
} = require("../../model/chatRoomUserModel");

const UserMutation = {
  updateUser: UserTC.mongooseResolvers.updateOne({
    filter: { isRequired: true, requiredFields: ["phone"] },
  }),
};

module.exports = { UserMutation };
