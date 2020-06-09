# Base64 Decode

Transforms a base64 string into alternatives (ascii, utf-8 etc)

## Usage

```yaml
version: 1.0

streams:
  - type: file-read-stream
    options:
      path: "./contents-in-base64.txt"

  # Base64 encode will take a buffer or a string
  - type: base64-decode
    options:
      encoding: utf-8

  - console
```
