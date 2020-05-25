import network from "../network";
import { Readable } from "readable-stream";

interface JsonApiHref {
  href: string;
}

interface JsonApiLinks {
  related?: JsonApiHref;
  first?: JsonApiHref;
  next?: JsonApiHref;
  prev?: JsonApiHref;
  self?: JsonApiHref;
}

interface JsonApiEnvelope {
  data: any;
  links: JsonApiLinks;
}

interface JsonApiOptions {
  limit?: number;
  debug?: boolean;
}

export default class JsonApiDataReadable<T> extends Readable {
  private href: string;
  private generator: any;
  private limit: number;
  private count: number;
  private useDebug: boolean;

  constructor(href: string, options?: JsonApiOptions) {
    super({ objectMode: true });

    this.href = href;

    const { limit = 0, debug = false } = options || {};
    this.limit = limit;
    this.count = 0;
    this.useDebug = debug;
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("JsonApiDataReadable:", ...args);
    }
  }

  async *getRecordsGenerator() {
    let url = this.href;

    while (true) {
      const httpOptions = {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      };
      this.debug("Calling:", url);
      let query: JsonApiEnvelope;
      try {
        query = await network.objectRead(url, httpOptions);
      } catch (e) {
        this.debug("Retrying:", url);
        await new Promise((success) => setTimeout(success, 5000));
        query = await network.objectRead(url, httpOptions);
      }

      if (!query) {
        throw Error("Unable to process url");
      }

      if (Array.isArray(query.data)) {
        for (let value of query.data) {
          yield value;
        }
      } else {
        yield query.data;
      }

      // Check to continue processing
      if (
        query.links &&
        query.links.next &&
        query.links.next.href &&
        query.links.next.href !== url
      ) {
        this.debug("Following links, next href");
        url = query.links.next.href;
      } else {
        break;
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
          this.debug("Pushing a value", this.count);
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.debug(
            "Finishing:",
            done ? "Done" : "Not done",
            "Limit:",
            this.count,
            "/",
            this.limit
          );
          this.push(null);
        }
      } catch (e) {
        this.destroy(e);
      }
    })();
  }
}

export function createReadStream<T>(href: string, options?: JsonApiOptions) {
  return new JsonApiDataReadable<T>(href, options);
}
