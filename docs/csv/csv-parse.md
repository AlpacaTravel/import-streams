# CSV Parse

Parses a CSV (or any delimeter separated contents) stream into a object.

## Usage

```yaml
version: 1.0

stream:
  # Take a readable stream of the CSV
  - type: fetch-stream
    options:
      url: https://www.example.com/my-csv-file.csv

  # CSV Parse
  - type: csv-parse
    options:
      # Optional...
      # Detect and exlude the byte order mark
      bom: true
      # Cast types, detect input strings to native types
      cast: true
      # Create objects with keyed values, otherwise an array
      # Auto-detect with:
      # columns: true
      columns:
        - valueA
        - valueB
      # The delimiter... defaults to ,
      delimiter: ,
      # The escape character
      escape: '"'
      # Ignore whitespace immediately following the delimiter
      ltrim: true
      # Ignore whitespace preceding the delimiter
      rtrim: true

  # Do something with the values...

  # Console output the CSV
  - console
```
