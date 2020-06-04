# CSV Parse

Parses a CSV (or any delimeter separated contents) stream into a object.

## Usage

```yaml
version: 1.0

stream:
  # Take a readable set of objects from a JSON file
  - type: fetch-object
    options:
      url: https://www.example.com/my-source.json
      path: items
      iterate: true

  # CSV stringify
  - type: csv-stringify
    options:
      # Optional...
      # Detect and exlude the byte order mark
      bom: true
      # Create objects with keyed values, otherwise an array
      columns:
        - valueA
        - valueB
      # The delimiter... defaults to ,
      delimiter: ,

  # Do something with the values...

  # Console output the CSV
  - type: file-write-stream
    options:
      path: "./local.csv"
```
