# JSON:API Object

Provides a readable stream of data from a JSON:API end-point.

Capable of reading through sets of objects, continuing through each result set following the next links.

## Usage

```yaml
version: 1.0

stream:
  # Obtain objects from the json-api
  - type: json-api-object
    options:
      # Required:
      href: https://www.mysite.com/jsonapi/resources
      # Optional:
      # Limit the records returned from the json-api end-point
      limit: 100
      # Debug what is queried from the end-point
      debug: true

  # Objects pushed into stream
  - console
```
