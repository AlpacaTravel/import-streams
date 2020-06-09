# Alpaca Sync External Items

This write stream is provided to sync items against the Alpaca API (v2). It will sync items received against the target collection, checking for presence and ensuring that updates are pushed into the collection. After the stream finishes, it will mark items that weren't received but were originally present in the collection, in order to detect places that are now removed.

Requirements:

- Registered API Key (Request your prviate WRITE scope API key in the form of sk.123)
- Collection REF (in the form of alpaca://collection/123)
- Profile REF (in the form of alpaca://profile/123)

This external sync items stream works based on syncing items that meet the JSON schema `https://schemas.alpaca.travel/item-v1.0.0.schema.json`.

Overview of mandatory structure to leverage this stream.

- `$schema` matching "https://schemas.alpaca.travel/item-v1.0.0.schema.json"
- `created` and `updated` dates, matching ISO8601
- `attributes` array, containing 2 attributes `{ attribute: { $ref: 'custom://external-ref' }, value: <IMPORT_SOURCE_RECORD_ID> }` and `{ attribute: { $ref: 'custom://external-source' }, value: <IMPORT_SOURCE_ID> }`

You can read your item places from any source (JSON:API, CSV, HTTP Fetch request, File etc) and map to the required structure using the map-selector.

## Usage

```yaml
version: 1.0

stream:
  # This "object" stream is just for demonstration, can be any source
  - type: object
    options:
      value:
        # This structure describes a place object with syncing info
        # and can come from any source that maps to this structure
        # collection and profile will be added by the external sync
        $schema: https://schemas.alpaca.dev/item-v1.0.0.schema.json
        # Dates used to detect whether an update is necessary
        created: 2020-06-10
        updated: 2020-06-10
        # Content...
        title: Melbourne
        synopsis: Visit our city
        tags:
          - tag1
          - tag2
        # Resource (a place)
        resource:
          $schema: https://schemas.alpaca.dev/place-v1.0.0.schema.json
          # Position as long,lat decimal
          position: [144.946457, -37.840935]
          name: Melbourne
          media:
            # Example collection of media
            - $schema: https://schemas.alpaca.dev/media-v1.0.0.schema.json
              provider: My Site
              type: image
              # Include some information about the original file
              original:
                width: 800
                height: 600
              # Describe many available sizes to optimise loads
              sources:
                - src: small.jpeg
                  type: image/jpeg
                  width: 600
                  height: 400
              # You can optimise the URL mentions
              # Composition: {url.prefix}{source.src}
              url:
                prefix: https://www.mysite.com/images/
              # You can include information like attribution or caption
              attribution: A photographer (https://photographer.photo)
              caption: This is an example caption
        # Item Attributes (can support locale, etc)
        attributes:
          # There is a list of standardised item attributes
          - attribute:
              $ref: alpaca://attribute/place/website-url
            value: https://www.mysite.com/record-123
          # These are the custom attributes required for syncing
          - attribute:
              $ref: custom://external-ref
            # The ID in your platform (anything)
            value: record-123
          - attribute:
              $ref: custom://external-source
            # The source of the import (anything, website URL is fine)
            value: https://www.mysite.com

  # This service will update changed records in the collection and mark
  # them as present (to detect removals)
  - type: alpaca-sync-external-items
    options:
      apiKey: sk.123
      collection: alpaca://collection/123
      profile: alpaca://profile/123
      externalSource: https://www.mysite.com
```
