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
      const query = await callable(current);

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
