# Crypto Encrypt

A transform stream that encrypt a stream with a crypto algorithm and password

## Usage

```yaml
version: 1.0

stream:
  # Stream in a file from somewhere (e.g. a hello world txt)
  - type: fetch-stream
    options:
      url: https://raw.githubusercontent.com/AlpacaTravel/import-streams/master/packages/import-streams/tests/data/file.txt

  - type: crypto-encrypt
    options:
      algorithm: aes-256-ctr
      password: e8dF3eqe

  # Use the file-write-stream to write the output
  - type: file-write-stream
    options:
      # Required:
      path: ./file.enc
```
