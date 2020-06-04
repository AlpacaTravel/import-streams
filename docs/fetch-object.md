# Fetch Object

This readable stream will read an object using fetch. This object is parsed as JSON and can have objects selected or iterated over into the stream.

## Usage

```yaml
version: 1.0

stream:
  # Obtain objects via HTTP requests
  - type: fetch-object
    options:
      # Required
      url:
        # Optional, you can just supply one string, or an array of URL's
        - https://www.my-data-store-location.com/1.json
      # Optional:
      # Path to the object/s
      path: some.path.to.objects
      # Iterate each of the items at the path, each individual object is pushed
      iterate: true
      # Limit the number of items fetched
      limit: 100
      # HTTP Method, get default..
      method: get
      # HTTP Headers
      headers:
        X-AccessToken: pk.12..
      # Number of retries where the !res.ok
      retry: 2
      # Wait, the ms to wait between retries
      wait: 1000

  # Each of the objects obtained from the above URL's are pushed into the stream..

  # Now do what we want to...

  # Map the objects to a different structure
  - type: map-selector
    options:
      mapping:
        # Simple 1:1 mapping
        name: title
        tags: tags
        # Map the lngLat to a position
        position:
          path: lngLat
          transform:
            - position
        # Obtain a synopsis from the summary, or body if summary missing
        # Make text (strip html), truncate down (smart, avoid mid-word etc)
        synopsis:
          path:
            - summary
            - body
          transform:
            - text
            - truncate
        # Read in the body, but strip any complex formatting and make it pretty
        body:
          path: body
          transform:
            - html-sanitize
            - html-prettier
        # .. etc to change the file shape

  # Filter objects based on a "tag" being present, etc
  - type: filter-fexp
    options:
      expression:
        - in
        - - get
          - tags
        - my-tag

  # Sync the items into an Alpaca collection
  - type: sync-external-items
    options:
      apiKey: sk.123...
      collection: alpaca://collection/1234
      profile: alpaca://profile/1234
```
