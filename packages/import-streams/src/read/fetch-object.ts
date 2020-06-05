import { Readable } from "readable-stream";
import URI from "urijs";
import network from "../network";
import selector from "../selector";
import assert from "assert";

export interface Headers {
  [str: string]: any;
}

export interface FetchObjectOptions {
  limit?: number;
  offset?: number;
  retry?: number;
  wait?: number;
  path?: string;
  headers?: Headers;
  method?: string;
  debug?: boolean;
  iterate?: boolean;
  data?: any;
}

export interface FetchPaginatedObjectsOptions extends FetchObjectOptions {
  pagesize: number;
  pagesizeQueryParam?: string;
  pathTotalRecords: string;
}

export interface OffsetBaseOptions extends FetchPaginatedObjectsOptions {
  offsetQueryParam: string;
}

export interface PageBasedOptions extends FetchPaginatedObjectsOptions {
  pageQueryParam: string;
  usePageStartingAtOne?: boolean;
}

const isPageBasedOptions = (
  options?: FetchObjectOptions
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
  options?: FetchObjectOptions
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
  private path?: string;
  private method: string;
  private headers: Headers;
  private limit?: number;
  private offset?: number;
  private pagesize?: number;
  private pagesizeQueryParam?: string;
  private offsetQueryParam?: string;
  private pageQueryParam?: string;
  private pathTotalRecords?: string;
  private wait: number;
  private iterate: boolean;
  private retries: number;
  private usePageStartingAtOne?: boolean;
  private generator?: any;
  private count: number;
  private useDebug: boolean;
  private data?: any;

  constructor(
    url: string,
    options: FetchObjectOptions | OffsetBaseOptions | PageBasedOptions
  ) {
    super({ objectMode: true });

    this.count = 0;

    const {
      offset,
      limit,
      retry = 3,
      wait = 5000,
      headers = {},
      method = "get",
      path,
      iterate = true,
      data,
    } = options || {};

    // If we are using a paging set, pages go up by 1
    if (isPageBasedOptions(options)) {
      const {
        usePageStartingAtOne = true,
        pageQueryParam,
        pagesizeQueryParam,
        pathTotalRecords,
        pagesize = 50,
      } = options;
      this.usePageStartingAtOne = usePageStartingAtOne;
      this.pageQueryParam = pageQueryParam;
      this.pagesizeQueryParam = pagesizeQueryParam;
      this.pathTotalRecords = pathTotalRecords;
      this.pagesize = pagesize;
      assert(!offset, "Offset not supported");
    }
    // If we are using offset, the offset goes up by the record count
    if (isOffsetBaseOptions(options)) {
      const {
        offsetQueryParam,
        pagesize = 50,
        pathTotalRecords,
        pagesizeQueryParam,
      } = options;
      this.offsetQueryParam = offsetQueryParam;
      this.pathTotalRecords = pathTotalRecords;
      this.pagesizeQueryParam = pagesizeQueryParam;
      this.pagesize = pagesize;
    }

    // Options
    this.url = url;
    this.data = data;
    this.offset = offset;
    this.limit = limit;
    this.iterate = iterate;
    this.path = path;

    // Network configuration
    this.headers = headers;
    this.method = method;
    this.wait = wait;
    this.retries =
      (typeof retry === "boolean" && retry === true ? 1 : 0) ||
      (typeof retry === "number" && retry) ||
      0;

    this.useDebug = options.debug === true;

    if (!isPageBasedOptions(options) && !isOffsetBaseOptions(options)) {
      assert(
        !this.pathTotalRecords,
        "Should specify either offset or paged based options"
      );
    } else {
      assert(
        this.pathTotalRecords,
        "Missing the path to total records pathTotalRecords"
      );
      assert(this.path, "Specify the location of the records to emit");
    }
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("fetch-object:", ...args);
    }
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
        data: this.data,
      };

      this.debug("Calling", url);

      return network.objectRead<any>(url, opts);
    };

    // Build the URL's dynamically as we continue through the set
    let recordCount = this.offset || 0;
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

        // Select the path
        let result = query;
        if (this.path != null) {
          result = selector(this.path, result);
        }

        // Parse the results
        if (Array.isArray(result) && this.iterate) {
          // Read through set
          this.debug("Found", result.length);
          for (let record of result) {
            yield record;
          }
        } else {
          yield result;
        }

        // Extract out our current
        if (this.pathTotalRecords) {
          // Update our pager
          page += 1;

          recordCount += result.length;
          // We have a total
          totalRecords = Number(selector(this.pathTotalRecords, query));
        } else {
          // don't continue processing
          break;
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
          this.debug("Pushing", value);
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.debug("Done");
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
  options: FetchObjectOptions | OffsetBaseOptions | PageBasedOptions
) {
  return new FetchObject<T>(url, options);
}
