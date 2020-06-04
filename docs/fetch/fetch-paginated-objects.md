# Fetch Paginated Objects

This readable stream will fetch objects through a series of HTTP requests by following a configured set of page, offset or pagesize query params.

The stream can operate either incrementing a page number (e.g. 1, 2, 3) or increasing an offset value (e.g. 0, 20, 40, 60).

## Usage

```yaml
version: 1.0

stream:
  # Obtain objects via HTTP requests
  - type: fetch-paginated-objects
    options:
      # Required:
      # URL of the end-point
      url: https://www.my-data-store-location.com/endpoint?key=123
      # The path to total records (e.g. { total: 1000 }) in the response
      pathTotalRecords: total

      # Optional:
      # Configure the number of elements per page
      pagesize: 100
      # Configure the size param (?size=XX)
      pagesizeQueryParam: size
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

      # Either; Offset Based configuration
      offset: 0
      # Adds the offset value through each call ?offset=X
      offsetQueryParam: offset

      # OR Paged Based
      # Adds through each call ?pge=0
      pageQueryParam: pge
      # Instead of starting at page=0, start at page=1
      usePageStartingAtOne: true

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
