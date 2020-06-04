# AWS S3 Get Object Stream

This import stream is a Readable Stream that can fetch a stream to a Amazon S3 Object.

## Usage

```yaml
version: 1.0

stream:
  # Use the aws-s3-get-object-stream to obtain the contents of an object stored in S3
  - type: aws-s3-get-object-stream
    options:
      # Required
      bucket: example-bucket-name
      key: path/to/key.csv.gz
      # Optional
      region: AP-SOUTHEAST-2

  # The contents are streamed to ther streams, such as CSV parsing

  # Use Zlib to parse the compression
  - gunzip

  # As an example, parse the stream here
  - type: csv-parse
    options:
      columns: true
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,

  # output to screen
  - process.stdout
```
