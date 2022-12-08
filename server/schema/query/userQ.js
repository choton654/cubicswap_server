const { GraphQLError, GraphQLNonNull } = require("graphql");
const { UserTC } = require("../../model/userModel");

const UserQuery = {
  authUser: UserTC.mongooseResolvers
    .findOne({ lean: true })
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authenticate");
      }

      if (
        rp.args.filter._id.toString() !== rp.context.req.user._id.toString()
      ) {
        throw new GraphQLError("Not Authorized");
      }

      return next(rp);
    }),

  checkForPhone: UserTC.mongooseResolvers.findOne({
    lean: true,
    filter: { isRequired: true, requiredFields: ["phone"] },
  }),
};

module.exports = { UserQuery };
