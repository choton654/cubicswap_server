/** @format */

const express = require("express");
const { ApolloServer } = require("apollo-server-express");
// const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
// const { execute, subscribe } = require("graphql");
const dotenv = require("dotenv");
dotenv.config();
// const PushNotifications = require("@pusher/push-notifications-server");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const xss = require("xss-clean");
const { createServer } = require("http");
const { connectDB } = require("./config/db.js");
const port = process.env.PORT || 3005;
const schema = require("./schema");
const { createContext } = require("./context");
var cors = require('cors')
// const rateLimit = require("express-rate-limit");

// route files
const user = require("./routes/users");
const product = require("./routes/products");
const cart = require("./routes/cart");
const order = require("./routes/order");
const { auth } = require("./middleware/authMiddleware.js");
const { beamsClient } = require("./utils/bemsClient.js");

const getApp = async () => {
  connectDB();


  const app = express();
  app.use(cors())
  const httpServer = createServer(app);

  app.use(compression());

  app.use(cookieParser());

  // body parser
  app.use(express.json({ limit: "5mb" }));

  // dev logging middleware
  app.use(morgan("dev"));

  //Data sanitization against Nosql query injections
  app.use(mongoSanitize());

  //Data sanitization against XSS(cross site scripting attacks)
  app.use(xss());

  //development logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  //Limit request from same IP
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100,
  //   message: "Too many requests from this IP, please try again in an hour!",
  // });
  // app.use("/api", limiter);

  app.set("trust proxy", 1);

  app.use(auth);

  app.disable("x-powered-by");

  app.get("/api/pusher/beams-auth", auth, function (req, res) {
    // Do your normal auth checks here 🔒
    const userId = req.user._id.toString(); // get it from your auth system
    const userIDInQueryParam = req.query["user_id"].toString();
    if (userId !== userIDInQueryParam) {
      res.status(401).send("Inconsistent request");
    } else {
      const beamsToken = beamsClient.generateToken(userId);
      console.log("successfully registered");
      res.send(JSON.stringify(beamsToken));
    }
  });

  // mount routes
  app.use("/api/users", user);
  app.use("/api/products", product);
  app.use("/api/cart", cart);
  app.use("/api/orders", order);
  app.use("/api/hello", (req, res) => {
    return res.send("hello world");
  });

  // const subscriptionServer = SubscriptionServer.create(
  //   { schema, execute, subscribe },
  //   { server: httpServer, path: "/api/graphql" }
  // );

  const apolloServer = new ApolloServer({
    schema,
    context: async ({ req, res }) => createContext(req, res),
    formatError: e => e.message,
    // plugins: [
    //   ApolloServerPluginDrainHttpServer({ httpServer }),
    //   {
    //     async serverWillStart() {
    //       return {
    //         async drainServer() {
    //           subscriptionServer.close();
    //         },
    //       };
    //     },
    //   },
    // ],
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    path: "/api/graphql",
    cors: true,
  });


  httpServer.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
    console.log(`🚀 Graphql Server ready at http://localhost:${port}${apolloServer.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${port}${apolloServer.graphqlPath}`);
  });
};

module.exports = { getApp };

// app.use(
//   "/api",
//   createProxyMiddleware({
//     target: process.env.BASE_URL,
//     changeOrigin: true,
//   })
// );

// const server = httpServer.listen(port, () => {
//   const wsServer = new ws.Server({
//     server,
//     path: "/api/graphql",
//   });

//   useServer(
//     {
// schema,
// execute,
// subscribe,
// onError: (e) => console.log(e),
// onComplete: () => console.log("complete"),
// onConnect: () => console.log("connect"),
// onDisconnect: () => console.log("disconnect"),
//     },
//     wsServer,
//     9000
//   );
//   console.log(`🚀 Server ready at http://localhost:${port}`);
//   console.log(
//     `🚀 Graphql server ready at http://localhost:${port}/api/graphql`
//   );
// });

// app.use(
//   "/api/graphql",
//   graphqlHTTP((req, res) => ({
//     schema,
//     graphiql: process.env.NODE_ENV !== "production",
//     context: createContext(req, res),
//   }))
// );

// const server = httpServer.listen(port, () => {
//   // create and use the websocket server
//   const wsServer = new ws.Server({
//     server,
//     path: "/api/graphql",
//   });

//   useServer({ schema }, wsServer);
//   console.log(`🚀 Server ready at http://localhost:${port}`);
//   console.log(
//     `🚀 Graphql Server ready at http://localhost:${port}${apolloServer.graphqlPath}`
//   );
// });

// const ws = createServer((req, res) => {
//   res.writeHead(400);
//   res.end();
// });

// ws.listen(3001, () => console.log("websocket listening on port ", 3001));

// const subscriptionServer = SubscriptionServer.create(
//   {
//     schema,
//     execute,
//     subscribe,
//     onConnect: () => console.log("client connected"),
//   },
//   { server: ws, path: "/api/graphql" }
// );

// apolloServer .applyMiddleware({
//   app,
//   path: "/api/graphql",
//   cors: false,
// });

// apolloServer .installSubscriptionHandlers(httpServer);

// const wsServer = new ws.Server({
//   server: httpServer,
//   path: "/api/graphql",
// });

// httpServer.listen(port, () => {
//   useServer({ schema }, wsServer);
//   console.info("Listening on http://localhost:3005/api/graphql");
// });

// app.get("/service-worker.js", (req, res) => {
//   app.serveStatic(req, res, "./.next/service-worker.js");
// });

// const serviceWorkers = [
//   {
//     filename: "service-worker.js",
//     path: "./.next/service-worker.js",
//   },
//   {
//     filename: "firebase-messaging-sw.js",
//     path: "./public/firebase-messaging-sw.js",
//   },
// ];

// serviceWorkers.forEach(({ filename, path }) => {
//   app.get(`/${filename}`, (req, res) => {
//     app.serveStatic(req, res, path);
//   });
// });

// const server = httpServer.listen(port, () => {
//   // create and use the websocket server
//   const wsServer = new ws.Server({
//     server,
//     path: "/api/graphql",
//   });

//   useServer(
//     {
//       schema,
//       onConnect: () => console.log("connect"),
//       onDisconnect: () => console.log("disconnect"),
//     },
//     wsServer,
//     9000
//   );
//   console.log(`🚀 Server ready at http://localhost:${port}`);
//   console.log(
//     `🚀 Graphql Server ready at http://localhost:${port}${apolloServer .graphqlPath}`
//   );
//   console.log(
//     `🚀 Subscriptions ready at ws://localhost:${port}${apolloServer .subscriptionsPath}`
//   );
// });

// const cacheableResponse = require("cacheable-response");

// "start": "node src/index.js -p $PORT",
// "start": "pm2-runtime start ecosystem.config.js --env production",
// "dev": "nodemon src/index.js",
// "start": "NODE_ENV=production node src/index.js"
// pm2 start --name=<your project dir> npm -- start

// const ssrCache = cacheableResponse({
//   ttl: 1000 * 60 * 60, // 1hour
//   get: async ({ req, res }) => {
//     const rawResEnd = res.end;
//     const data = await new Promise((resolve) => {
//       res.end = (payload) => {
//         resolve(res.statusCode === 200 && payload);
//       };
//       nextApp.render(req, res, req.path, {
//         ...req.query,
//         ...req.params,
//       });
//     });
//     res.end = rawResEnd;
//     return { data };
//   },
//   send: ({ data, res }) => res.send(data),
// });

// cache pages
// app.get("/", (req, res) => ssrCache({ req, res }));
// app.get("/search", (req, res) => ssrCache({ req, res }));
// app.get("/allUsers", (req, res) => ssrCache({ req, res }));
// app.get("/createSeller", (req, res) => ssrCache({ req, res }));
// app.get("/addProduct", (req, res) => ssrCache({ req, res }));
// app.get("/signIn", (req, res) => ssrCache({ req, res }));
// app.get("/signUp", (req, res) => ssrCache({ req, res }));
// app.get("/categories", (req, res) => ssrCache({ req, res }));
// app.get("/product/:id", (req, res) => ssrCache({ req, res }));
// app.get("/categories/:catId", (req, res) => ssrCache({ req, res }));
