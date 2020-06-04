import { Transform, Writable } from "readable-stream";
import assert from "assert";
import { TransformOptions } from "../types";
import { createReadStream } from "../read/aws-s3-get-object-stream";

interface ResolveAwsS3GetObjectStreamOptions extends TransformOptions {
  bucket?: string;
  region?: string;
}

type Callback = (err?: Error | undefined, data?: any) => void;

class ResolveAwsS3GetObjectStream extends Transform {
  private bucket?: string;
  private region?: string;

  constructor(options: ResolveAwsS3GetObjectStreamOptions) {
    super({ objectMode: true });

    this.bucket = options.bucket;
  }

  _transform(value: any, _: string, cb: Callback) {
    // Take a value
    const [bucket, key] = (() => {
      if (value && typeof value === "object") {
        const { Bucket, bucket, Key, key } = value;
        return [Bucket || bucket || this.bucket, Key || key];
      }
      return [];
    })();

    assert(bucket, "Missing a configured bucket");
    assert(key, "Missing a configured key");

    const out = (ch: any) => this.push(ch);

    // Into a stream
    const writable = new Writable({
      write(chunk: any, _: string, callback: Callback) {
        out(chunk);
        callback();
      },
    });

    const source = createReadStream(bucket, key, {
      region: this.region,
    });

    // Process through...
    source
      .on("error", (err: Error) => cb(err))
      .pipe(writable)
      .on("finish", () => cb())
      .on("error", (err: Error) => cb(err));
  }
}

export default ResolveAwsS3GetObjectStream;
