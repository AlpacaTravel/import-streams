# File Write Stream

A basic read stream, wrapping fs.createWriteStream.

## Usage

```yaml
version: 1.0

stream:
  # Stream in a file from somewhere (e.g. a hello world txt)
  - type: fetch-object
    options:
      url: https://raw.githubusercontent.com/AlpacaTravel/import-streams/master/packages/import-streams/tests/data/file.txt

  - gzip

  - type: crypto-encrypt
    options:
      algorithm: aes256
      password: test

  # Use the file-write-stream to write the output
  - type: file-write-stream
    options:
      # Required:
      path: ./output.txt.gz
```
