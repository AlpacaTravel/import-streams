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

type AxiosEmptyRequest = (url: string, options?: any) => Promise<any>;
type AxiosBodyRequest = (url: string, data: any, options?: any) => Promise<any>;

// TODO: This is messy! refactor this to use aspect or a container with logger manager

const wrapEmptyRequest = async (
  desc: string,
  func: AxiosEmptyRequest,
  url: string,
  options?: any
) => {
  const prod = process.env.NODE_ENV !== "test";
  prod && console.log("Queing Network", desc, url);
  try {
    const response = await func(url, options);
    return response;
  } catch (e) {
    prod && console.error("Network call encountered an error", desc, url);
    throw e;
  }
};

const wrapBodyRequest = async (
  desc: string,
  func: AxiosBodyRequest,
  url: string,
  data: any,
  options?: any
) => {
  const prod = process.env.NODE_ENV !== "test";
  prod && console.log("Queing Network", desc, url);
  try {
    const response = await func(url, data, options);
    return response;
  } catch (e) {
    prod && console.error("Network call encountered an error", desc, url);
    throw e;
  }
};

export default {
  // Read concurrency
  get: (url: string, options?: any) =>
    wrapEmptyRequest("get", read.get, url, options),
  options: (url: string, options?: any) =>
    wrapEmptyRequest("options", read.options, url, options),

  // Write concurrency
  put: (url: string, data: any, options?: any) =>
    wrapBodyRequest("put", write.put, url, data, options),
  post: (url: string, data: any, options?: any) =>
    wrapBodyRequest("post", write.post, url, data, options),
  patch: (url: string, data: any, options?: any) =>
    wrapBodyRequest("patch", write.patch, url, data, options),
  delete: (url: string, options: any) =>
    wrapEmptyRequest("delete", write.delete, url, options),
};
