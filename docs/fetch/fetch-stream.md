# Fetch Stream

Uses a fetch request to obtain a steam. This can be used for large files that can be streamed (such as CSV) into processing.

## Usage

```yaml
version: 1.0

stream:
  - type: fetch-stream
    options:
      # Required
      url: https://www.mysite.com/example.csv

      # Optional
      # HTTP Method, get default..
      method: get
      # HTTP Headers
      headers:
        X-AccessToken: pk.12..

  # Parse the stream into csv...
  - type: csv-parse
    options:
      columns: true
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,

  # output to screen
  - process.stdout
```
