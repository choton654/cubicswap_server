const { default: axios } = require("axios");
const {
  GraphQLString,
  GraphQLError,
  GraphQLBoolean,
  GraphQLNonNull,
} = require("graphql");
const mongoose = require("mongoose");
const { StoreTC, Store } = require("../../model/storeModel");
const { User } = require("../../model/userModel");

const StoreMutation = {
  addStore: {
    type: new GraphQLNonNull(StoreTC.getType()),
    args: {
      city: "String!",
      pincode: "String!",
      roadName: "String!",
      state: "String!",
      district: "String!",
      landmark: "String!",
      storeName: "String!",
      aboutStore: "String!",
      phone: "String!",
      owner: "MongoID!",
    },
    resolve: async (
      source,
      {
        city,
        pincode,
        roadName,
        state,
        district,
        landmark,
        storeName,
        aboutStore,
        owner,
        phone,
      },
      { req },
      info
    ) => {
      if (!req.user) {
        throw new GraphQLError("Not Authenticated");
      }

      if (req.user.role === "user") {
        throw new GraphQLError("Not Authorized, no seller account found");
      }
      if (owner.toString() !== req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        const existingStore = await Store.findOne({
          owner: req.user._id,
        }).lean();

        if (existingStore) {
          throw new GraphQLError("already have a store");
        }

        const { data } = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${roadName.trim()},${landmark.trim()},${city.trim()},${district.trim()},${pincode.trim()},${state.trim()}.json?access_token=pk.eyJ1IjoiY2hvdG9uNjU0IiwiYSI6ImNrbHplZGJ4YjBpYXgybm82Z3FiZGg4aGcifQ.wSmhE4fTXoL30pmxurQQZw`
        );

        console.log(data);
        const geocodeAddress = {
          type: "Point",
          coordinates: data.features[0].geometry.coordinates,
          formattedAddress: data.features[0].place_name,
        };

        const store = await Store.create({
          address: {
            city,
            pincode,
            roadName,
            state,
            district,
            landmark,
          },
          storeName,
          aboutStore,
          owner,
          phone: `91${phone}`,
          geocodeAddress,
        });

        await User.findOneAndUpdate(
          { phone: req.user },
          { $set: { storeId: store._id } }
        );

        return store;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("Something went wrong");
      }
    },
  },

  updateStoreImage: {
    type: GraphQLBoolean,
    args: {
      images: "[String!]!",
      storeId: "MongoID!",
      owner: "MongoID!",
    },
    resolve: async (source, { storeId, owner, images }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not Authenticated");
      }

      if (req.user.role.toString() === "user") {
        throw new GraphQLError("Not Authorized");
      }
      if (owner.toString() !== req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        const store = await Store.updateOne(
          {
            _id: mongoose.Types.ObjectId(storeId),
            owner: mongoose.Types.ObjectId(req.user._id),
          },
          {
            $addToSet: {
              images: {
                $each: [...images],
              },
            },
          },
          { upsert: true }
        );
        return true;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("can not found any store");
      }
    },
  },

  updateStoreVideo: {
    type: GraphQLBoolean,
    args: {
      video: "String!",
      storeId: "MongoID!",
      owner: "MongoID!",
    },
    resolve: async (source, { storeId, owner, video }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not Authenticated");
      }

      if (req.user.role.toString() === "user") {
        throw new GraphQLError("Not Authorized");
      }
      if (owner.toString() !== req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        await Store.updateOne(
          {
            _id: mongoose.Types.ObjectId(storeId),
            owner: mongoose.Types.ObjectId(req.user._id),
          },
          {
            $addToSet: {
              videos: {
                $each: [...video],
              },
            },
          },
          { upsert: true }
        );
        return true;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("can not found any store");
      }
    },
  },

  deleteStoreImage: {
    type: GraphQLBoolean,
    args: {
      image: "String!",
      storeId: "MongoID!",
      owner: "MongoID!",
    },
    resolve: async (source, { storeId, owner, image }, { req }, info) => {
      if (!req.user) {
        throw new GraphQLError("Not Authenticated");
      }

      if (req.user.role.toString() === "user") {
        throw new GraphQLError("Not Authorized");
      }
      if (owner.toString() !== req.user._id.toString()) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        const store = await Store.updateOne(
          {
            _id: mongoose.Types.ObjectId(storeId),
            owner: mongoose.Types.ObjectId(req.user._id),
          },
          {
            $pull: {
              images: image,
            },
          },

          { upsert: true }
        );
        return true;
      } catch (error) {
        console.error(error);
        throw new GraphQLError("can not found any store");
      }
    },
  },

  updeteStore: StoreTC.mongooseResolvers
    .updateOne({
      filter: {
        isRequired: true,
        requiredFields: ["_id"],
      },
    })
    .wrapResolve((next) => (rp) => {
      if (!rp.context.req.user) {
        throw new GraphQLError("Not Authorized");
      }
      // if (
      //   rp.context.req.user._id.toString() !== rp.args.filter.owner.toString()
      // ) {
      //   throw new GraphQLError("Not Authorized");
      // }

      if (rp.context.req.user.role.toString() !== "admin") {
        throw new GraphQLError("Not Authorized");
      }

      return next(rp);
    }),
};

module.exports = { StoreMutation };

// createStore: StoreTC.mongooseResolvers
//   .createOne()
//   .wrapResolve((next) => async (rp) => {
//     const {
//       args: { record },
//       context: { req },
//       source,
//     } = rp;
//     console.log(source);

//     if (!req.user) {
//       throw new GraphQLError("Not Authenticated");
//     }

//     if (record.owner.toString() !== req.user._id.toString()) {
//       throw new GraphQLError("Not Authorized");
//     }
//     const { city, pincode, roadName, state, district, landmark } =
//       record.address;
//     if (
//       !record.address.city ||
//       !record.address.pincode ||
//       !record.address.roadName ||
//       !record.address.state ||
//       !record.address.district ||
//       !record.address.landmark ||
//       !record.storeName ||
//       !record.aboutStore
//     ) {
//       throw new GraphQLError("required field missing");
//     }
//     if (req.user.role !== "seller") {
//       throw new GraphQLError("Not Authorized, no seller account found");
//     }

//     try {
//       const existingStore = await Store.findOne({
//         owner: req.user._id,
//       }).lean();

//       if (existingStore) {
//         throw new GraphQLError("already have a store");
//       }

//       try {
//         const { data } = await axios.get(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${roadName},${landmark},${district},${city},${pincode},${state}.json?access_token=pk.eyJ1IjoiY2hvdG9uNjU0IiwiYSI6ImNrbHplZGJ4YjBpYXgybm82Z3FiZGg4aGcifQ.wSmhE4fTXoL30pmxurQQZw`
//         );

//         console.log(data);
//         source.geocodeAddress = {
//           type: "Point",
//           coordinates: data.features[0].geometry.coordinates,
//           formattedAddress: data.features[0].place_name,
//         };

//         return next(rp);
//       } catch (error) {
//         console.error(error);
//         throw new GraphQLError("faield to found address");
//       }

//       // return next(rp);
//     } catch (error) {
//       console.error(error);
//       throw new GraphQLError("Something went wrong");
//     }
//   }),
