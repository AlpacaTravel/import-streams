# AWS S3 List Objects

This readable stream will stream references to S3 Objects stored within a bucket.

Note: This will continue past the 1000 limit by using continuation tokens, allowing you to stream more than the standard AWS per request limit.

## Usage

```yaml
version: 1.0

stream:
  # Read in matching S3 items
  - type: aws-s3-list-objects
    options:
      # Required:
      bucket: my-bucket

      # Optional:
      # Prefix to objects
      prefix: path/my-csv-files
      # AWS Region
      region: AP-SOUTHEAST-2
      # Limit the number of object references returned
      limit: 100
      # Debug what is happening in the stream through console.lo
      debug: true

  # Each listed object is streamed..
  # { Key: ..., ETag: ..., LastModified: ..., Size: ..., StorageClass: ..., }

  # Filter the key based on some regexp
  # In this example, match gzip'd CSV files (e.g. files with "*csv.gz")
  - type: filter-fexp
    options:
      expression:
        # Uses a "fexp-js" query to filter matching keys
        # Supports a wide range of operations, like boolean operators etc
        - regex-test
        - - to-regex
          - csv.gz$
        - - get
          - Key

  # Read in each of the CSV streams
  # This resolve function will take listed S3 objects and read them in
  - type: resolve-aws-s3-get-object-stream
    options:
      bucket: my-bucket

  # Inflate the compression
  - gunzip

  # Read into a csv
  - type: csv-parse
    options:
      columns: true
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,

  # Match each row against a criteria
  - type: filter-fexp
    options:
      expression:
        # A fexp-js expression, such as matching Column A > 300 (whatever that is)
        - ">"
        - - get
          - Column A
        - 300

  # Store back into a local CSV
  - type: csv-stringify
    options:
      bom: true
      columns:
        # Maybe reduce the columns stored?
        - Column A
        - Column B
      delimiter: ,
      header: true

  # Compress
  - gzip

  # Store to a file
  - type: file-write-stream
    options:
      path: "./output.csv"
```

```javascript
// Example of the object being sent to the stream
{
  ETag: "70ee1738b6b21e2c8a43f3a5ab0eee71",
  Key: "happyface.jpg",
  LastModified: <Date Representation>,
  Size: 11,
  StorageClass: "STANDARD"
}
```
