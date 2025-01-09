const { getApp } = require("./startServer");

getApp();

// const getListener = () => {
//   const server = getApp();
//   const [listener] = server.listeners("request");
//   return listener;
// };

// module.exports = { getListener };

// pm2 start npm --name "app name" -- start
// pm2 start npm --name "app name" -- start


// ai prompt to generate mongodb query 

// mongoDbQuery = """
// You are a MongoDB query generator. Your task is to take a user's input query and transform it into a MongoDB query that retrieves data from a MongoDB database.

// <userQuery>
// {userQuery}
// </userQuery>

// <Schemas>
// {schemas}
// </Schemas>

// <usersLocation>
// [longitude, latitude]: {usersLocation}
// </usersLocation>

// Guidelines for generating the query:
// - Filter results based on proximity to the user's location (within 10 km).
// - Use a geospatial query for proximity filtering.
// - Generate only