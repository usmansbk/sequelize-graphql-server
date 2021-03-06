import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  AuthenticationError,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import http from "http";
import logger from "~utils/logger";
import { INVALID_CLIENT_ID } from "~helpers/constants/responseCodes";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import dataSources from "./datasources";
import applyDirectives from "./directives";
import errorPlugin from "./plugins/errorPlugin";

export const createSchema = () => {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return applyDirectives(schema);
};

const createApolloServer = (app) => {
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema: createSchema(),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), errorPlugin],
    logger,
    dataSources,
    cache: "bounded",
    context: ({ req: { t, context } }) => {
      if (!context.clients.includes(context.clientId)) {
        throw new AuthenticationError(INVALID_CLIENT_ID);
      }
      return { t, ...context };
    },
  });
  return { server, httpServer };
};

const startApolloServer = async (app) => {
  const { server, httpServer } = createApolloServer(app);
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => {
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve);
  });
  return server;
};

export default startApolloServer;
