import { Writable } from "readable-stream";
import * as AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { createReadStream } from "../../../src/read/aws-s3-get-object-stream";

type Callback = (err: Error | null, data: any) => void;

describe("aws-s3-get-object-stream", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  test("createReadStream", async () => {
    let output: string = "";

    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("S3", "getObject", (params: any, callback: Callback) => {
      callback(null, {
        Body: Buffer.from(
          fs.readFileSync(path.resolve(__dirname, "../../data/file.txt"))
        ),
      });
    });

    const writable = new Writable({
      objectMode: true,
      write(chunk, enc, cb) {
        output += chunk;
        cb();
      },
    });

    const read = createReadStream("example-bucket", "example-key", {});

    await new Promise((success, failure) => {
      read.pipe(writable).on("finish", success).on("error", failure);
    });

    expect(output).toBe("Hello import-streams, you are running!");
  });
});
