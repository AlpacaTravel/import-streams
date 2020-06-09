# Sqlite Statement Read

This readable stream will prepare a Sqlite statement exec to obtain all results. The resulting rows are streamed.

## Usage

```yaml
version: 1.0

stream:
  # Create a read stream for objects returned from a SQL query
  - type: sqlite-statement-object
    options:
      # Required:
      database: ./sqlite-database.db
      sql: SELECT column_a, column_b FROM my_table LIMIT 100
      # Optional
      debug: true

  # Create a CSV output
  - csv-stringify

  # Output the file locally
  - type: file-write-stream
    options:
      path: ./output.csv
```
