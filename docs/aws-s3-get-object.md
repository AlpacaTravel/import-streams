# AWS S3 Get Object

This is an readable import stream that will fetch an object from S3, but differs to the _aws-s3-get-object-stream_ in that the buffer is converted to a string/JSON.

You can then target JSON objects within the object, and iterate on those items

## Usage

```yaml
version: 1.0

stream:
  - type: aws-s3-get-object
    options:
      # Required
      bucket: my-bucket
      key: path/to/my-file.json
      # Optional:
      # AWS Region
      region: AP-SOUTHEAST-2
      # The path to the object within the JSON structure, e.g.
      # "foo" on { foo: [1, 2, 3] } returns [1, 2, 3]
      path: foo
      # Stream objects individually
      # path of "foo" and iterate = true on { foo: [1, 2, 3] } will stream 1, 2, 3 as seprate objects
      iterate: true
      # Limit the number of objects streamed. The stream will be limited
      limit: 10
      # Parse the contents as JSON (done automatically if ContentType is application/json)
      parseJson: true
      # Encoding
      encoding: utf-8
      # Debug, will use the console.log to output debug information about the stream
      debug: true

  # Individual objects from the S3 JSON file are pushed into the stream

  # Filter the objects as they are streamed
  - type: filer-fexp
    options:
      expression:
        - all
        - - "!empty"
          - - get
            - id
        - - "!empty"
          - - get
            - name

  # Reduce into a collection
  - concat

  # Stringify back to JSON string
  - json-stringify

  # Compress
  - gzip

  # Write out the file
  - type: file-write-stream
    option:
      path: "./local.json.gz"
```
