const { Category, CategoryTC } = require("../../model/categoryModel");

const CategoryMutation = {
  createCategory: CategoryTC.mongooseResolvers
    .createOne({
      record: { isRequired: true, requiredFields: ["name", "hasProduct"] },
    })
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      if (rp.context.req.user.role !== "admin") {
        throw new GraphQLError("Not Authorized");
      }
      return next(rp);
    }),

  updateCategory: CategoryTC.mongooseResolvers
    .updateMany()
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      if (rp.context.req.user.role !== "admin") {
        throw new GraphQLError("Not Authorized");
      }
      return next(rp);
    }),
};

module.exports = { CategoryMutation };
