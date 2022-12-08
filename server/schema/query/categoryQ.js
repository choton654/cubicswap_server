const { Category, CategoryTC } = require("../../model/categoryModel");

const CategoryQuery = {
  getCategories: CategoryTC.mongooseResolvers.findMany({
    findManyOpts: {
      lean: true,
    },
  }),
};

module.exports = { CategoryQuery };
