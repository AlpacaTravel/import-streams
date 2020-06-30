import fetch from "isomorphic-unfetch";
import Bottleneck from "bottleneck";
import { Readable } from "readable-stream";

// Split the concurrency, we can often read more we can write

// TODO: Push the network controls out to a container, allowing for plugging

// Set of reasonable (slow) 3rd party throttled limits
const readMaxConcurrent = process.env.NETWORK_READ_MAX_CONCURRENT
  ? Number(process.env.NETWORK_READ_MAX_CONCURRENT)
  : 5;
const readMinTime = process.env.NETWORK_READ_MIN_TIME
  ? Number(process.env.NETWORK_READ_MIN_TIME)
  : 1000 / readMaxConcurrent;
const writeMaxConcurrent = process.env.NETWORK_WRITE_MAX_CONCURRENT
  ? Number(process.env.NETWORK_WRITE_MAX_CONCURRENT)
  : 2;
const writeMinTime = process.env.NETWORK_WRITE_MIN_TIME
  ? Number(process.env.NETWORK_WRITE_MIN_TIME)
  : 1000 / writeMaxConcurrent;

const read = new Bottleneck({
  maxConcurrent: readMaxConcurrent,
  minTime: readMinTime,
}).wrap(fetch);

const write = new Bottleneck({
  maxConcurrent: writeMaxConcurrent,
  minTime: writeMinTime,
}).wrap(fetch);

type Fetch = (url: string, options: any) => Promise<any>;

type RetriableFunction = () => Promise<Response>;

const retry = async (
  callable: RetriableFunction,
  retries = 1,
  delay = 1000
): Promise<Response> => {
  let res: Response | undefined;
  let attempts = 0;
  while (attempts <= retries) {
    try {
      // Make an attempt
      attempts += 1;
      res = await callable();
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} - ${res.statusText}`);
      }

      // Break if successful (we have a query)
      break;
    } catch (e) {
      // If we are more than we want to retry
      if (attempts > retries) {
        throw e;
      }
      // Just back off and we will retry
      await new Promise((success) => setTimeout(success, delay));
    }
  }

  if (!res) {
    throw new Error("Unable to process request");
  }

  return res;
};

const stream = (source: Fetch) => {
  function aStream(url: string, options: any): Promise<Readable> {
    let timeout: any = null;
    return Promise.race<Promise<Readable>>([
      new Promise((resolve) => {
        // Create a timeout value
        timeout = setTimeout(resolve, 30000, () => {
          throw new Error(`Timeout value exceeded calling ${url}`);
        });
      }),
      (async () => {
        return source(url, options).then((res) => {
          // Clear our neighbour
          if (timeout != null) {
            clearTimeout(timeout);
          }
          if (!res.ok) {
            throw new Error(`${res.status} - ${res.statusText}`);
          }
          return res.body;
        });
      })(),
    ]);
  }

  return aStream;
};

const object = (source: Fetch) => {
  async function aObject<T>(url: string, options: any): Promise<T> {
    let timeout: any = null;
    return Promise.race<Promise<T>>([
      new Promise((resolve) => {
        // Create a timeout value
        timeout = setTimeout(resolve, 30000, () => {
          throw new Error(`Timeout value exceeded calling ${url}`);
        });
      }),
      (async () => {
        const httpHeaders = Object.assign(
          {},
          {
            Accept: "application/json",
          },
          options.headers
        );

        const httpOptions = Object.assign(
          {},
          {
            headers: httpHeaders,
          },
          options
        );

        const res = await source(url, httpOptions);
        // Clear our neighbour
        if (timeout != null) {
          clearTimeout(timeout);
        }

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const converted = await res.textConverted();
        const data = JSON.parse(converted) as Promise<T>;

        return await data;
      })(),
    ]);
  }

  return aObject;
};

const methods = {
  retry,
  read,
  write,
  stream: stream(fetch),
  object: object(fetch),
  streamRead: stream(read),
  objectRead: object(read),
  fetch: fetch,
};

export default methods;
