const { schemaComposer } = require("graphql-compose");
const { RootMutation } = require("./mutation");
const { RootQuery } = require("./query");
const { RootSub } = require("./subscription");

schemaComposer.Query.addFields(RootQuery);

schemaComposer.Mutation.addFields(RootMutation);

schemaComposer.Subscription.addFields(RootSub);

const graphqlSchema = schemaComposer.buildSchema();

module.exports = graphqlSchema;
