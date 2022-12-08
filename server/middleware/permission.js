const { rule, shield, and, or, not } = require("graphql-shield");

const isAuthenticated = rule({ cache: "contextual" })(
  async (parent, args, ctx, info) => {
    return ctx.req.user !== null;
  }
);

const isSeller = rule({ cache: "contextual" })(
  async (parent, args, ctx, info) => {
    return ctx.req.user.role === "seller";
  }
);

const isUser = rule({ cache: "contextual" })(
  async (parent, args, ctx, info) => {
    return ctx.req.user.role === "user";
  }
);

// Permissions

const permissions = shield({
  //   Query: {
  //     frontPage: not(isAuthenticated),
  //     fruits: and(isAuthenticated, or(isAdmin, isEditor)),
  //     customers: and(isAuthenticated, isAdmin),
  //   },
  Mutation: {
    createOrder: and(isAuthenticated, isUser),
    addToCart: and(isAuthenticated, isUser),
    addToCheckout: and(isAuthenticated, isUser),
    removeFromCart: and(isAuthenticated, isUser),
  },
  //   Fruit: isAuthenticated,
  //   Customer: isAdmin,
});

module.exports = { permissions };
