import { Readable } from "readable-stream";
import URI from "urijs";
import network from "../network";
import selector from "../selector";
import assert from "assert";

export interface Headers {
  [str: string]: any;
}

interface FetchPaginatedObjectsOptions {
  limit?: number;
  offset?: number;
  retry?: number;
  wait?: number;
  pagesize?: number;
  pagesizeQueryParam?: string;
  pathTotalRecords: string;
  path: string;
  headers?: Headers;
  method?: string;
}

interface OffsetBaseOptions extends FetchPaginatedObjectsOptions {
  offsetQueryParam: string;
}

interface PageBasedOptions extends FetchPaginatedObjectsOptions {
  pageQueryParam: string;
  usePageStartingAtOne?: boolean;
}

const isPageBasedOptions = (
  options?: FetchPaginatedObjectsOptions
): options is PageBasedOptions => {
  if (!options) {
    return false;
  }
  if ("pageQueryParam" in options) {
    return true;
  }
  return false;
};

const isOffsetBaseOptions = (
  options?: FetchPaginatedObjectsOptions
): options is OffsetBaseOptions => {
  if (!options) {
    return false;
  }
  if ("offsetQueryParam" in options) {
    return true;
  }
  return false;
};

export default class FetchObject<T> extends Readable {
  private url: string;
  private path: string;
  private method: string;
  private headers: Headers;
  private limit?: number;
  private offset: number;
  private pagesize: number;
  private pagesizeQueryParam?: string;
  private offsetQueryParam?: string;
  private pageQueryParam?: string;
  private pathTotalRecords: string;
  private wait: number;
  private retries: number;
  private usePageStartingAtOne?: boolean;
  private generator?: any;
  private count: number;

  constructor(url: string, options: OffsetBaseOptions | PageBasedOptions) {
    super({ objectMode: true });

    this.count = 0;

    const {
      offset = 0,
      limit,
      pagesize = 50,
      retry = 3,
      wait = 5000,
      headers = {},
      method = "get",
      path,
      pagesizeQueryParam,
      pathTotalRecords,
    } = options || {};

    // If we are using a paging set, pages go up by 1
    if (isPageBasedOptions(options)) {
      const { usePageStartingAtOne = true, pageQueryParam } = options;
      this.usePageStartingAtOne = usePageStartingAtOne;
      this.pageQueryParam = pageQueryParam;
    }
    // If we are using offset, the offset goes up by the record count
    if (isOffsetBaseOptions(options)) {
      const { offsetQueryParam } = options;
      this.offsetQueryParam = offsetQueryParam;
    }

    // Options
    this.url = url;
    this.offset = offset;
    this.limit = limit;
    this.pagesize = pagesize;
    this.pagesizeQueryParam = pagesizeQueryParam;

    this.path = path;
    this.pathTotalRecords = pathTotalRecords;

    assert(this.path, "Specify the location of the records to emit");
    assert(
      this.pathTotalRecords,
      "Specify the path to locate the total records from the response using pathTotalRecords"
    );
    assert(
      this.offsetQueryParam || this.pageQueryParam,
      "Specify either the offset or page query param (offsetQueryParam or pageQueryPage)"
    );
    assert(
      (this.offset === 0 && this.pageQueryParam) ||
        (!this.pageQueryParam && this.offsetQueryParam),
      "Unsupported offset with page"
    );

    // Network configuration
    this.headers = headers;
    this.method = method;
    this.wait = wait;
    this.retries =
      (typeof retry === "boolean" && retry === true ? 1 : 0) ||
      (typeof retry === "number" && retry) ||
      0;
  }

  async *getRecordsGenerator() {
    const headers = {
      Accept: "application/json",
      ["Content-Type"]: "application/json",
    };

    const callable = (url: string) => {
      const opts = {
        headers: Object.assign({}, headers, this.headers),
        method: this.method,
      };

      return network.objectRead<any>(url, opts);
    };

    // Build the URL's dynamically as we continue through the set
    let recordCount = this.offset;
    let page = this.usePageStartingAtOne === true ? 1 : 0;
    let totalRecords = recordCount + 1; // Optimistically, we will assume there is a record
    while (recordCount < totalRecords) {
      // Create the first URL to be called
      const uri = new URI(this.url);
      if (this.offsetQueryParam) {
        uri.addSearch(this.offsetQueryParam, recordCount);
      }
      if (this.pagesizeQueryParam) {
        uri.addSearch(this.pagesizeQueryParam, this.pagesize);
      }
      if (this.pageQueryParam) {
        uri.addSearch(this.pageQueryParam, page);
      }

      // Callable URL
      const url = uri.toString();

      try {
        let query: any | undefined = undefined;
        let attempts = 0;
        while (attempts <= this.retries) {
          try {
            // Make an attempt
            attempts += 1;
            query = await callable(url);
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

        let result = query;
        if (this.path !== null) {
          result = selector(this.path, result);
        }

        if (!Array.isArray(result)) {
          break;
        }

        // Read through
        for (let record of result) {
          yield record;
        }

        // Update our pager
        page += 1;
        recordCount += result.length;

        // Extract out our current
        if (this.pathTotalRecords) {
          totalRecords = Number(selector(this.pathTotalRecords, query));
        }
      } catch (e) {
        throw e;
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
  url: string,
  options: OffsetBaseOptions | PageBasedOptions
) {
  return new FetchObject<T>(url, options);
}
