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
}

export default class JsonApiDataReadable extends Readable {
  private href: string;
  private generator: any;
  private limit: number;
  private count: number;

  constructor(href: string, options?: JsonApiOptions) {
    super({ objectMode: true });

    this.href = href;

    const { limit = 0 } = options || {};
    this.limit = limit;
    this.count = 0;
  }

  async *getRecordsGenerator() {
    let url = this.href;

    while (true) {
      const { data: query }: { data: JsonApiEnvelope } = await network.get(
        url,
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        }
      );

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

export const createReadStream = (href: string, options?: JsonApiOptions) => {
  const api = new JsonApiDataReadable(href, options);

  return api;
};
