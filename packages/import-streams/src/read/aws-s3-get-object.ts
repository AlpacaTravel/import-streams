import { Readable } from "readable-stream";
import AWS from "aws-sdk";
import selector from "../selector";

interface AwsS3GetObjectOptions {
  limit?: number;
  debug?: boolean;
  region?: string;
  path?: string;
  iterate?: boolean;
  encoding?:
    | "utf-8"
    | "ascii"
    | "utf8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex";
  parseJson?: boolean;
}

export default class AwsS3GetObject extends Readable {
  private count: number;
  private useDebug: boolean;
  private region?: string;
  private bucket: string;
  private keys: string[];
  private generator?: any;
  private limit?: number;
  private path?: string;
  private iterate: boolean;
  private encoding?:
    | "utf-8"
    | "ascii"
    | "utf8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex";
  private parseJson: boolean;

  constructor(
    bucket: string,
    keys: string | string[],
    options: AwsS3GetObjectOptions
  ) {
    super({ objectMode: true });

    this.count = 0;

    this.useDebug = options.debug === true;

    this.bucket = bucket;
    this.keys = Array.isArray(keys) ? keys : [keys];

    const {
      limit = 0,
      path,
      iterate = false,
      encoding = "utf-8",
      parseJson = false,
    } = options;

    this.region = options.region;
    this.limit = limit;
    this.path = path;
    this.iterate = iterate;
    this.encoding = encoding;
    this.parseJson = parseJson;
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("aws-s3-list-objects:", ...args);
    }
  }

  async *getRecordsGenerator() {
    const keys = this.keys.map((key) => key);

    const s3 = new AWS.S3({
      apiVersion: "2006-03-01",
      region: this.region,
    });

    const params = {
      Bucket: this.bucket,
    };

    // Build the URL's dynamically as we continue through the set
    let current;
    while ((current = keys.pop())) {
      try {
        // Build the query
        const currentParams: AWS.S3.GetObjectRequest = Object.assign(
          {},
          params,
          { Key: current }
        );
        this.debug(currentParams);

        // Callable URL
        const query = await s3.getObject(currentParams).promise();

        // Process the entire
        let result = query.Body?.toString(this.encoding);

        if (
          (result != null && this.parseJson === true) ||
          (query.ContentType && /application\/.*json/i.test(query.ContentType))
        ) {
          result = JSON.parse(result as string);
        }

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
        }: { value: AWS.S3.ObjectList; done: boolean } = await generator.next();
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

export function createReadStream(
  bucket: string,
  keys: string | string[],
  options: AwsS3GetObjectOptions
) {
  return new AwsS3GetObject(bucket, keys, options);
}
