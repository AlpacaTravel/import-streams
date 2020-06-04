import * as AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { Readable, Writable } from "readable-stream";
import ResolveAwsS3GetObjectStream from "../../../src/transform/resolve-aws-s3-get-object-stream";
import { createCompose } from "../../../src/index";

const compose = createCompose();
const context = {
  compose,
};

type Callback = (err: Error | null, data: any) => void;

describe("Resolve AWS S3", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  test("on array data", async () => {
    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("S3", "getObject", (params: any, callback: Callback) => {
      expect(params.Bucket).toBe("example-bucket");
      expect(params.Key).toBe("example-key");
      callback(null, {
        Body: Buffer.from(
          fs.readFileSync(path.resolve(__dirname, "../../data/file.txt"))
        ),
      });
    });

    const options = {
      context,
      bucket: "example-bucket",
      mapping: {
        foo: "overview",
      },
    };

    const transform = new ResolveAwsS3GetObjectStream(options);

    let output: string = "";

    const read = new Readable({
      objectMode: true,
      read() {
        this.push({ key: "example-key" });
        this.push(null);
      },
    });

    const write = new Writable({
      objectMode: true,
      write(chunk: any, _: string, cb) {
        output += chunk;
        cb();
      },
    });

    await new Promise((success, fail) => {
      read.pipe(transform).pipe(write).on("error", fail).on("finish", success);
    });

    expect(output).toBe("This is a file with some contents");
  });
});
