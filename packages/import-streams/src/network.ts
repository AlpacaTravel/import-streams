import axios from "axios";
import rateLimit from "axios-rate-limit";

// Split the concurrency, we can often read more we can write

// TODO: Push the network controls out to a container, allowing for plugging

const readLimit = {
  maxRequests: 5,
  perMilliseconds: 200,
  maxRPS: 5,
};
const writeLimit = {
  maxRequests: 2,
  perMilliseconds: 500,
  maxRPS: 2,
};
const read = rateLimit(
  axios.create(),
  process.env.NODE_ENV !== "test"
    ? readLimit
    : { maxRequests: 50, perMilliseconds: 20 }
);
const write = rateLimit(
  axios.create(),
  process.env.NODE_ENV !== "test"
    ? writeLimit
    : { maxRequests: 50, perMilliseconds: 20 }
);

interface NetworkMethods {
  [fn: string]: any;
}

const methods: NetworkMethods = {
  // Read concurrency
  get: (url: string, options?: any) => read.get(url, options),
  options: (url: string, options?: any) => read.options(url, options),

  // Write concurrency
  put: (url: string, data: any, options?: any) => write.put(url, data, options),
  post: (url: string, data: any, options?: any) =>
    write.post(url, data, options),
  patch: (url: string, data: any, options?: any) =>
    write.patch(url, data, options),
  delete: (url: string, options: any) => write.delete(url, options),
};

export default methods;
