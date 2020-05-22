import assert from "assert";
import { Readable } from "readable-stream";
import network from "../network";
import selector from "../selector";

export interface Headers {
  [str: string]: any;
}

export interface HttpRequestOptions {
  method?: string;
  limit?: number;
  headers?: Headers;
  iterate?: boolean;
  path?: string;
  data?: any;
}

const isFunction = (fn: any): fn is Function => {
  if (typeof fn === "function") {
    return true;
  }
  return false;
};

export default class HttpRequest extends Readable {
  private urls: string[];
  private generator: any;
  private limit: number;
  private count: number;
  private method: string;
  private path?: string;
  private headers: Headers;
  private iterate: boolean;
  private data: boolean;

  constructor(urls: string | string[], options?: HttpRequestOptions) {
    super({ objectMode: true });

    const processedUrls = Array.isArray(urls) ? urls : [urls];
    assert(
      processedUrls.every((url) => typeof url === "string"),
      "Supplied URLs should be strings"
    );

    this.urls = processedUrls;

    const {
      limit = 0,
      method = "get",
      headers = {},
      path,
      iterate = false,
      data,
    } = options || {};
    this.limit = limit;
    this.count = 0;
    this.method = method;
    this.headers = headers;
    this.path = path;
    this.iterate = iterate;
    this.data = data;
  }

  async *getRecordsGenerator() {
    const urls = this.urls.map((url) => url);
    const method = this.method != null ? this.method : "get";

    // Build headers
    const httpOptions = {
      headers: this.headers,
    };

    // Attach data
    const data = this.data || null;

    const callable = (url: string) => {
      const fn = network[method.toLocaleLowerCase()];
      assert(isFunction(fn), "Method does not exist");
      if (["get"].indexOf(method) > -1) {
        return fn(url, httpOptions);
      }
      return fn(url, data, httpOptions);
    };

    // Source the records
    let current;
    while ((current = urls.pop())) {
      const { data: query }: { data: any } = await callable(current);

      // Peel off a section
      let result = query;
      if (this.path != null) {
        result = selector(this.path, result);
      }

      // Iterate on the response
      if (this.iterate === true && Array.isArray(result)) {
        for (let record of result) {
          yield record;
        }
      } else {
        yield result;
      }
    }
  }

  _read() {
    const generator = (() => {
      if (!this.generator) {
        this.generator = this.getRecordsGenerator();
      }

      return this.generator;
    })();

    (async () => {
      try {
        const { value, done } = await generator.next();
        if (value) {
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.push(null);
        }
      } catch (e) {
        console.error(e.message);
        this.destroy(e);
      }
    })();
  }
}

export const createReadStream = (
  urls: string | string[],
  options?: HttpRequestOptions
) => {
  const api = new HttpRequest(urls, options);

  return api;
};
