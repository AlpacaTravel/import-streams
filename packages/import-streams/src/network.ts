import fetch from "isomorphic-unfetch";
import Bottleneck from "bottleneck";
import { Readable } from "readable-stream";

// Split the concurrency, we can often read more we can write

// TODO: Push the network controls out to a container, allowing for plugging

const read = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,
}).wrap(fetch);

const write = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
}).wrap(fetch);

type Fetch = (url: string, options: any) => Promise<any>;

const stream = (source: Fetch) => {
  function aStream(
    url: string,
    options: any
  ): Promise<Readable | ReadableStream<Uint8Array> | null> {
    return source(url, options).then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.body;
    });
  }

  return aStream;
};

const object = (source: Fetch) => {
  async function aObject<T>(url: string, options: any): Promise<T> {
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
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const data = res.json() as Promise<T>;
    return await data;
  }

  return aObject;
};

const methods = {
  read,
  write,
  stream: stream(fetch),
  object: object(fetch),
  streamRead: stream(read),
  objectRead: object(read),
  fetch: fetch,
};

export default methods;
