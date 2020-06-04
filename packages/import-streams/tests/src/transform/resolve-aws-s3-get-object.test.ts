import * as AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import resolveAwsS3GetObject from "../../../src/transform/resolve-aws-s3-get-object";
import { createCompose } from "../../../src/index";

import fs from "fs";
import path from "path";

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
          fs.readFileSync(path.resolve(__dirname, "../../data/input.json"))
        ),
      });
    });

    const options = {
      context,
      bucket: "example-bucket",
      parseJson: true,
      iterate: false,
      mapping: {
        foo: "overview",
      },
    };
    const result = await resolveAwsS3GetObject({ Key: "example-key" }, options);

    expect(!Array.isArray(result)).toBe(true);
    if (!Array.isArray(result) && result != null) {
      expect(result).toMatchObject({
        foo: "<b>What a great place!</b> - &amp; so close to the beach",
      });
    }
  });
});
