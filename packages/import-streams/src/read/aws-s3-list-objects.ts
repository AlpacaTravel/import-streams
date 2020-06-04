import { Readable } from "readable-stream";
import AWS from "aws-sdk";

interface AwsS3ListObjectsOptions {
  limit?: number;
  debug?: boolean;
  region?: string;
  prefix?: string;
}

export default class AwsS3ListObjects extends Readable {
  private count: number;
  private useDebug: boolean;
  private region?: string;
  private prefix?: string;
  private bucket: string;
  private generator?: any;
  private limit?: number;

  constructor(bucket: string, options: AwsS3ListObjectsOptions) {
    super({ objectMode: true });

    this.count = 0;

    this.useDebug = options.debug === true;

    this.bucket = bucket;
    this.region = options.region;
    this.prefix = options.prefix;
    this.limit = options.limit;
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("aws-s3-list-objects:", ...args);
    }
  }

  async *getRecordsGenerator() {
    const s3 = new AWS.S3({
      apiVersion: "2006-03-01",
      region: this.region,
    });

    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: this.bucket,
      Prefix: this.prefix,
    };

    // Build the URL's dynamically as we continue through the set
    while (true) {
      try {
        // Callable URL
        const query = await s3.listObjectsV2(params).promise();

        const result = query.Contents;

        if (!Array.isArray(result)) {
          this.debug("Did not find pageable array in results");
          break;
        }

        this.debug("Found", result.length);

        // Read through
        for (let record of result) {
          yield record;
        }

        // If we have a next continuation token
        if (query.NextContinuationToken) {
          this.debug("Continuing via", query.NextContinuationToken);
          params.ContinuationToken = query.NextContinuationToken;
        } else {
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
  options: AwsS3ListObjectsOptions
) {
  return new AwsS3ListObjects(bucket, options);
}
