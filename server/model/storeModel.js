const mongoose = require("mongoose");
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const { UserTC } = require("./userModel");
const { ProductTC, Product, detailsSchema } = require("./productModel");
const { CategoryTC } = require("./categoryModel");

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const addressSchema = new mongoose.Schema({
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String, required: true },
  roadName: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  district: { type: String, required: true },
});

const StoreSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeName: {
      type: String,
      trim: true,
      required: true,
    },
    aboutStore: {
      type: String,
      trim: true,
      default: "Managed by Cubicswap",
    },
    details: [{ type: detailsSchema }],
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
    },
    images: [
      {
        type: String,
        validate: [val => val.length <= 10, "images exceeds the limit of 10"],
      },
    ],
    videos: [
      {
        type: String,
        validate: [val => val.length <= 4, "images exceeds the limit of 4"],
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    deliveryPrice: {
      type: Number,
      default: 0,
    },
    address: { type: addressSchema, require: true },
    geocodeAddress: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
    },
    isOpened: {
      type: Boolean,
      // required: true,
      default: true,
    },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

// StoreSchema.index({ location: "2dsphere" });
const Store = mongoose.models.Store || mongoose.model("Store", StoreSchema);

schemaComposer.delete("Store");

const StoreTC = composeMongoose(Store, {});

StoreTC.addRelation("owner", {
  resolver: () =>
    UserTC.mongooseResolvers.findById({
      lean: true,
    }),
  prepareArgs: { _id: source => source.owner },
  projection: { owner: true },
});

StoreTC.addRelation("categories", {
  resolver: () =>
    CategoryTC.mongooseResolvers.findByIds({
      lean: true,
    }),
  prepareArgs: { _ids: source => source.categories },
  projection: { categories: true },
});

StoreTC.addFields({
  products: {
    type: [ProductTC],
    resolve: async (source, args, ctx, info) => await Product.find({ storeId: source._id }).lean().limit(20),
  },
});

ProductTC.addRelation("storeId", {
  resolver: () =>
    StoreTC.mongooseResolvers.findById({
      lean: true,
    }),
  prepareArgs: { _id: source => source.storeId },
  projection: { storeId: true },
});

UserTC.addFields({
  myStore: {
    type: StoreTC,
    resolve: async (source, args, ctx, info) => await Store.findOne({ owner: source._id }).lean(),
  },
});

module.exports = { Store, StoreTC };

// %20${this.address.landmark}%20${this.address.city}%20${this.address.pincode}%20${this.address.district}%20${this.address.state}

// StoreTC.addRelation("hasProducts", {
//   resolver: () =>
//     CategoryTC.mongooseResolvers.findMany({
//       lean: true,
//       filter: {
//         isRequired: true,
//         requiredFields: ["hasProduct"],
//       },
//     }),
//   // prepareArgs: { filter: { _id: (source) => source._id } },
//   // projection: { _id: true },
// });

// StoreTC.addRelation("products", {
//   resolver: () =>
//     ProductTC.mongooseResolvers.findMany({
//       lean: true,
//       filter: {
//         isRequired: true,
//         requiredFields: ["storeID"],
//       },
//     }),
//   prepareArgs: { storeID: (source) => source._id },
//   projection: { storeID: true },
// });

// findManyOpts: {
//   lean: true,
//   filter: {
//     isRequired: true,
//     requiredFields: ["storeID"],
//   },
// },

// StoreTC.addRelation("category", {
//   resolver: () =>
//     CategoryTC.mongooseResolvers.findById({
//       lean: true,
//     }),
//   prepareArgs: { _id: (source) => source.category },
//   projection: { category: true },
// });

// StoreSchema.pre("save", async function (next) {
//   try {
//     const { data } = await axios.get(
//       `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.address}.json?access_token=pk.eyJ1IjoiY2hvdG9uNjU0IiwiYSI6ImNrbHplZGJ4YjBpYXgybm82Z3FiZGg4aGcifQ.wSmhE4fTXoL30pmxurQQZw`
//     );
//     // bbox=88.3883,22.4660,88.3928,22.7674?
//     //proximity=[88.3639,22.5726]?
//     // ?types=poi.restaurant
//     console.log(data);
//     this.geocodeAddress = {
//       type: "Point",
//       coordinates: data.features[0].geometry.coordinates,
//       formattedAddress: data.features[0].place_name,
//     };

//     next();
//   } catch (error) {
//     console.error(error);
//   }
// });
