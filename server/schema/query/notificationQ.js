const { GraphQLError } = require("graphql");
const { NotificationTC } = require("../../model/notificationModel");

const NotificationQuery = {
  getNotifications: NotificationTC.mongooseResolvers
    .findMany({
      filter: true,
      lean: true,
      limit: true,
      skip: true,
      sort: true,
    })
    .wrapResolve((next) => (rp) => {
      console.log(rp.args.filter);
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      return next(rp);
    }),

  getNotificationsCount: NotificationTC.mongooseResolvers
    .count({
      filter: {
        onlyIndexed: true,
      },
    })
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      return next(rp);
    }),
};

module.exports = { NotificationQuery };
