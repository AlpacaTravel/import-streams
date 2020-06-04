import { Writable } from "readable-stream";
import * as AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { createReadStream } from "../../../src/read/aws-s3-list-objects";

type Callback = (err: Error | null, data: any) => void;

describe("aws-s3-get-object", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  test("createReadStream", async () => {
    const output: any[] = [];

    AWSMock.setSDKInstance(AWS);

    let first = true;
    AWSMock.mock("S3", "listObjectsV2", (params: any, callback: Callback) => {
      if (first) {
        expect(params.ContinuationToken).toBeUndefined();
      } else {
        expect(params.ContinuationToken).not.toBeUndefined();
      }
      const data = {
        Contents: [
          {
            ETag: "70ee1738b6b21e2c8a43f3a5ab0eee71",
            Key: "happyface.jpg",
            Size: 11,
            StorageClass: "STANDARD",
          },
          {
            ETag: "becf17f89c30367a9a44495d62ed521a-1",
            Key: "test.jpg",
            Size: 4192256,
            StorageClass: "STANDARD",
          },
        ],
        IsTruncated: true,
        KeyCount: 2,
        MaxKeys: 2,
        Name: "examplebucket",
        NextContinuationToken:
          "1w41l63U0xa8q7smH50vCxyTQqdxo69O3EmK28Bi5PcROI4wI/EyIJg==",
        Prefix: "",
      };
      if (first) {
        callback(null, data);
        first = false;
      } else {
        callback(
          null,
          Object.assign({}, data, { NextContinuationToken: null })
        );
      }
    });

    const writable = new Writable({
      objectMode: true,
      write(chunk, enc, cb) {
        output.push(chunk);
        cb();
      },
    });

    const read = createReadStream("example-bucket", {});

    await new Promise((success, failure) => {
      read.pipe(writable).on("finish", success).on("error", failure);
    });

    expect(output).toMatchObject([
      {
        ETag: "70ee1738b6b21e2c8a43f3a5ab0eee71",
        Key: "happyface.jpg",
        Size: 11,
        StorageClass: "STANDARD",
      },
      {
        ETag: "becf17f89c30367a9a44495d62ed521a-1",
        Key: "test.jpg",
        Size: 4192256,
        StorageClass: "STANDARD",
      },
      {
        ETag: "70ee1738b6b21e2c8a43f3a5ab0eee71",
        Key: "happyface.jpg",
        Size: 11,
        StorageClass: "STANDARD",
      },
      {
        ETag: "becf17f89c30367a9a44495d62ed521a-1",
        Key: "test.jpg",
        Size: 4192256,
        StorageClass: "STANDARD",
      },
    ]);
  });
});
