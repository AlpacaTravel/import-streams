# File Read Stream

A basic read stream, wrapping fs.createReadStream.

## Usage

```yaml
version: 1.0

stream:
  # Stream in a file from the local filesystem
  - type: file-read-stream
    options:
      # Required
      path: ./path-to-file.csv

      # Optional
      encoding: utf-8
      # Flags
      flags: r

  # Use the stream...
  - process.stdout
```
