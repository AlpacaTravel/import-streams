# Resolve Sqlite Statement Read

This readable stream will prepare a Sqlite statement exec to obtain all results. The resulting rows are streamed.

## Usage

```yaml
version: 1.0

stream:
  # Take some objects in a stream
  - type: object
    options:
      value:
        - columnA: foo
        - columnA: bar

  # Create a resolve stream for objects returned from a SQL query
  - type: resolve-sqlite-statement-object
    options:
      # Required:
      database: ./sqlite-database.db
      sql: SELECT column_a, column_b FROM my_table WHERE column_a = @columnA LIMIT 100
      # Optional
      debug: true
      # Instead pass through the value received in the stream, opposed to returned results from sqlite statement
      # passThroughValue: true
      # mapping: is supported also

  # Create a CSV output
  - csv-stringify

  # Output the file locally
  - type: file-write-stream
    options:
      path: ./output.csv
```
