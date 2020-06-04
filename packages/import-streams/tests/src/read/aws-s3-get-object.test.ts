import { Writable } from "readable-stream";
import * as AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { createReadStream } from "../../../src/read/aws-s3-get-object";

type Callback = (err: Error | null, data: any) => void;

describe("aws-s3-get-object", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  test("createReadStream", async () => {
    const output: any[] = [];

    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("S3", "getObject", (params: any, callback: Callback) => {
      callback(null, {
        Body: Buffer.from(
          fs.readFileSync(path.resolve(__dirname, "../../data/input.json"))
        ),
      });
    });

    const writable = new Writable({
      objectMode: true,
      write(chunk, enc, cb) {
        output.push(chunk.uri);
        cb();
      },
    });

    const read = createReadStream("example-bucket", "example-key", {
      path: "links",
      parseJson: true,
      encoding: "utf-8",
      iterate: true,
    });

    await new Promise((success, failure) => {
      read.pipe(writable).on("finish", success).on("error", failure);
    });

    expect(output).toMatchObject([
      "https://www.facebook.com/alpacatravel/",
      "https://www.instagram.com/alpacatravel/",
      "https://twitter.com/alpacatravel?lang=en",
      "https://www.linkedin.com/company/alpacatravel/",
    ]);
  });
});
