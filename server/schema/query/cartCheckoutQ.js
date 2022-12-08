const { GraphQLError, GraphQLNonNull } = require("graphql");
const { CartTC } = require("../../model/cartModel");
const { CheckoutTC } = require("../../model/checkoutModal");
const { WishlistTC } = require("../../model/wishListModel");

const CartCheckoutQuery = {
	getMyWishlist: WishlistTC.mongooseResolvers
		.findOne({
			lean: true,
			filter: {
				requiredFields: ["user"],
				isRequired: true,
				// onlyIndexed: true,
			},
		})
		.wrapResolve((next) => (rp) => {
			if (!rp.context.req.user) {
				throw new GraphQLError("Not Authenticate");
			}

			if (rp.args.filter.user.toString() !== rp.context.req.user._id.toString()) {
				throw new GraphQLError("Not Authorized");
			}

			return next(rp);
		}),

	getMyCart: CartTC.mongooseResolvers
		.findOne({
			lean: true,
			filter: {
				requiredFields: ["user"],
				isRequired: true,
				onlyIndexed: true,
			},
		})
		.wrapResolve((next) => (rp) => {
			console.log("runnn");
			if (!rp.context.req.user) {
				throw new GraphQLError("Not Authenticate");
			}

			if (rp.args.filter.user.toString() !== rp.context.req.user._id.toString()) {
				throw new GraphQLError("Not Authorized");
			}

			return next(rp);
		}),

	getMyCheckout: CheckoutTC.mongooseResolvers
		.findOne({
			lean: true,
			filter: {
				isRequired: true,
				requiredFields: ["user"],
			},
		})
		.wrapResolve((next) => (rp) => {
			if (!rp.context.req.user) {
				throw new GraphQLError("Not Authenticate");
			}

			if (rp.args.filter.user.toString() !== rp.context.req.user._id.toString()) {
				throw new GraphQLError("Not Authorized");
			}

			return next(rp);
		}),
};

module.exports = { CartCheckoutQuery };
