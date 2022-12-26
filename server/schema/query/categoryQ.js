const { Category, CategoryTC } = require("../../model/categoryModel");

const CategoryQuery = {
  getCategories: CategoryTC.mongooseResolvers.findMany({
    findManyOpts: {
      lean: true,
    },
  }),
  getOneCategory: CategoryTC.mongooseResolvers.findOne({
    lean: true,
    filter: {
      requiredFields: ["_id"],
      isRequired: true,
    },
  }),
  getParentCategories: {
    type: [CategoryTC.getType()],
    args: {},

    resolve: async (_, __, ___, info) => {
      info.cacheControl.setCacheHint({ maxAge: 3600, scope: 'PUBLIC' });
      const categories = await Category.find({
        parentCatId: null, hasProduct: false
      }).lean()
      console.log(categories);
      // console.log(categories.filter(c => c.subCategories.length > 0));
      return categories
    }
  }
};

module.exports = { CategoryQuery };
