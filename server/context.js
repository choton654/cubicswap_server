const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const createContext = (req, res) => ({ req, res, pubsub });

module.exports = { pubsub, createContext };
