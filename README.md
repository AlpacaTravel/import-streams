# import-streams

[![Build Status](https://travis-ci.com/AlpacaTravel/import-streams.svg?branch=master)](https://travis-ci.com/AlpacaTravel/graph-sdk)[![Coverage Status](https://coveralls.io/repos/github/AlpacaTravel/import-streams/badge.svg?branch=master)](https://coveralls.io/github/AlpacaTravel/graph-sdk?branch=master)![MIT](https://img.shields.io/npm/l/@alpaca-travel/import-streams)

This project is currently in a Alpha Preview release.

A set of libraries ot assist import related tasks, assisting importing (or exporting) from one source (such as drupal or other API) to (or from) the Alpaca API.

Features:

- Read sources include JSON:API, which comes as a core module in Drupal v8 (and as an extension module to v9)
- Can process various field types, entity references and process image types
- Can sync from one or more sources into a one or more output destinations, such as the Alpaca Collections
- Rate limit reads and writes

## Outline of Streams

There are a lot of already developed streams available for processing input and sending output.

## Composeable Pipelines

More complex pipelines can define combined read/write sources, or branch processing based on the intended sources. In order to make it easier to build more complex pipelines that could potentially be defined in a configuration file and unique to the runtime requirements, the `@alpaca-travel/import-streams-compose` was created (which is used by the core import-streams).

The library exposes a `compose` function that can read an object defining simple or complex pipelines you wish to process.

The pipeline can create a set of pipelines "in series" (following the usual read -> (transform) -> write), but also branch and combine from other pipelines that could combine multiple read sources and write to multiple output sources.

This is the basis of creating reusable compositions that could be defined as JSON or YAML.

Features:

- Define stream pipelines
- Combine both read and write streams
- Supports complex branching
- Supports map-reduce patterns as well as other transformations
- Easily provide your own streams for further capabilities

```javascript
import compose from "@alpaca-travel/import-streams";
import fs from "fs";

// Example import configuration using import-streams
const yaml = `
version: 1.0
streams:
  # Site one source
  # You can combine additional read sources using "combine: ..."
  - type: json-api-data
    options:
      url: https://www.site1.com/jsonapi/type

  # Transform data
  - type: map-selector
    options:
      mapping:
        # Map a json-api data record
        title: attributes.title

        # Parse basic types with transforms
        modified:
          selector: attributes.changed
          transform:
            - date

        # Parse more complex values with pre-established transforms
        position:
          selector: attributes.lngLat
          type: position

        # Parse through multiple streams
        description:
          selector:
            - attributes.description
            # support additional selectors with fall-over
          transform:
            # Transform individual values
            - html-sanitize
            - html-prettier
        
        # Support map/reduce on individual fields
        tags:
          selector: relationships.field_types
          transform:
          # Leverage pre-existing transforms offered to map data
          - type: drupal.field-types.entity-reference
            options:
              iterate: true
              mapping:
                title: attributes.title
          # and reduce...
          - flatten

        # Support alpaca attributes
        custom://external-ref: id

        # With more complex transforms
        custom://external-source:
          selector: .
          transform:
            - type: replace
              options:
                value: https://www.site1.com


  # Stream additional phases with transformed docs, etc
  # ...

  # Sync only changed records to a collection, and hide missing
  # Note: You can also combine: to multiple write sources
  - type: sync-external-items
    options:
      apiKey: ...
      collection: alpaca://collection/123
      profile: alpaca://profile/XYZ
`;

const factory = ({ type, options }) => {
  // return my own streams here to mix them in
};

// Compose a stream based on a struct
const stream = compose(struct, { factory });
```
