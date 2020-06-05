# Crypto Encrypt

A transform stream that decrypt a stream with a crypto algorithm and password

## Usage

```yaml
version: 1.0

stream:
  # Stream in a file from somewhere (e.g. a hello world txt)
  - type: fetch-stream
    options:
      url: https://www.somewhere.com/file.enc

  - type: crypto-decrypt
    options:
      algorithm: aes-256-ctr
      password: e8dF3eqe

  # Use the file-write-stream to write the output
  - type: file-write-stream
    options:
      # Required:
      path: ./file.dec
```
