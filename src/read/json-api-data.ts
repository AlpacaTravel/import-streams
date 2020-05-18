import network from "../network";
import { Readable } from "stream";

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

interface JsonApiOptions {}

export default class JsonApiDataReadable extends Readable {
  private href: string;

  constructor(href: string, options?: JsonApiOptions) {
    super({ objectMode: true });

    this.href = href;
  }

  _read() {
    let url = this.href;

    (async () => {
      // Continue processing through the records until the end
      while (true) {
        try {
          const { data: query }: { data: JsonApiEnvelope } = await network.get(
            url,
            {
              headers: {
                Accept: "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
              },
            }
          );

          // Read the data
          if (Array.isArray(query.data)) {
            query.data.forEach((record) => this.push(record));
          } else {
            this.push(query.data);
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
        } catch (e) {
          console.error(e.message);
          this.destroy(e);
        }
      }

      this.push(null);
    })();
  }
}

export const createReadStream = (href: string, options?: JsonApiOptions) => {
  const api = new JsonApiDataReadable(href, options);

  return api;
};
