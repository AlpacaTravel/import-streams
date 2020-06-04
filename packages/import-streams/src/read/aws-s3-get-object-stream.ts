import stream from "stream";
import AWS from "aws-sdk";

interface AwsS3GetObjectOptions {
  region?: string;
}

export function createReadStream(
  bucket: string,
  key: string,
  options?: AwsS3GetObjectOptions
) {
  const { region } = options || {};

  const s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    region,
  });

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const passthrough = new stream.PassThrough();

  s3.getObject(params, (err, data) => {
    if (err) {
      passthrough.destroy(err);
      return;
    }
    if (data.Body == null) {
      passthrough.destroy(new Error("Unable to obtain body buffer"));
    }

    const buff = data.Body as Buffer;
    passthrough.end(buff);
  });

  return passthrough;
}
