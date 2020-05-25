import assert from "assert";
import { Readable } from "readable-stream";
import network from "../network";
import selector from "../selector";

export interface Headers {
  [str: string]: any;
}

export interface FetchObjectOptions {
  method?: string;
  limit?: number;
  headers?: Headers;
  iterate?: boolean;
  path?: string;
  data?: any;
  retry?: boolean | number;
  wait?: number;
}

export default class FetchObject<T> extends Readable {
  private urls: string[];
  private generator: any;
  private limit: number;
  private count: number;
  private method: string;
  private path?: string;
  private headers: Headers;
  private iterate: boolean;
  private data: any;
  private retries: number;
  private wait: number;

  constructor(urls: string | string[], options?: FetchObjectOptions) {
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
      retry = 1,
      wait = 5000,
    } = options || {};
    this.limit = limit;
    this.count = 0;
    this.method = method;
    this.headers = headers;
    this.path = path;
    this.iterate = iterate;
    this.data = data;
    this.wait = wait;
    this.retries =
      (typeof retry === "boolean" && retry === true ? 1 : 0) ||
      (typeof retry === "number" && retry) ||
      0;
  }

  async *getRecordsGenerator() {
    const urls = this.urls.map((url) => url);
    const headers = {
      Accept: "application/json",
      ["Content-Type"]: "application/json",
    };

    const callable = (url: string) => {
      const opts = {
        headers: Object.assign({}, headers, this.headers),
        method: this.method,
        data: this.data,
      };

      return network.objectRead<any>(url, opts);
    };

    // Source the records
    let current;
    while ((current = urls.pop())) {
      let query: any | undefined = undefined;
      let attempts = 0;
      while (attempts <= this.retries) {
        try {
          // Make an attempt
          attempts += 1;
          query = await callable(current);
          // Break if successful (we have a query)
          break;
        } catch (e) {
          // If we are more than we want to retry
          if (attempts > this.retries) {
            throw e;
          }
          // Just back off and we will retry
          await new Promise((success) => setTimeout(success, this.wait));
        }
      }

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
        const {
          value,
          done,
        }: { value: T; done: boolean } = await generator.next();
        if (value) {
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.push(null);
        }
      } catch (e) {
        console.error(e);
        this.destroy(e);
      }
    })();
  }
}

export function createReadStream<T>(
  urls: string | string[],
  options?: FetchObjectOptions
) {
  return new FetchObject<T>(urls, options);
}
