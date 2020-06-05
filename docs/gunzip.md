# Gzip

The transform stream `gunzip` will use zlib in order to inflate the stream

## Usage

```yaml
version: 1.0

stream:
  # Stream in a file from somewhere (e.g. a hello world txt)
  - type: fetch-stream
    options:
      url: https://somehost.com/example.txt.gz

  # Guzip
  - gunzip

  # Use the file-write-stream to write the output
  - type: file-write-stream
    options:
      # Required:
      path: ./inflated.txt
```
