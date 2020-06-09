# Base64 Encode

Transform a string value into Base64

## Usage

```yaml
version: 1.0

streams:
  - type: file-read-stream
    options:
      path: "./contents.txt"

  # Base64 encode will take a buffer or a string
  - base64-encode

  - console
```
