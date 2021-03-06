import Redis from "ioredis";

const { REDIS_CLUSTER_MODE, REDIS_PORT, REDIS_HOST, REDIS_URL, NODE_ENV } =
  process.env;

const port = REDIS_PORT;
const host = REDIS_HOST;

const createClient = () => {
  let redisOptions;

  if (NODE_ENV === "production") {
    redisOptions = {
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  if (REDIS_CLUSTER_MODE === "enabled") {
    return new Redis.Cluster(
      [
        {
          port,
          host,
        },
      ],
      {
        redisOptions,
      }
    );
  }

  if (REDIS_URL) {
    return new Redis(REDIS_URL, redisOptions);
  }

  return new Redis({ port, host }, redisOptions);
};

const client = createClient();

export default client;
