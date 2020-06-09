# import-streams

[![Build Status](https://travis-ci.com/AlpacaTravel/import-streams.svg?branch=master)](https://travis-ci.com/AlpacaTravel/graph-sdk)[![Coverage Status](https://coveralls.io/repos/github/AlpacaTravel/import-streams/badge.svg?branch=master)](https://coveralls.io/github/AlpacaTravel/import-streams?branch=master)![MIT](https://img.shields.io/npm/l/@alpaca-travel/import-streams)

This project is currently in a Alpha Preview release.

A simple tool that describes streams to process imports or data processing in YAML/JSON.

## Getting Started

Let's start with creating an simple YAML file `stream.yaml` which will pipe a file obtained from this repository to the command line.

```yaml
version: 1.0

# Trivial stream
stream:
  # Read a URL source
  - type: fetch-stream
    options:
      url: https://raw.githubusercontent.com/AlpacaTravel/import-streams/master/packages/import-streams/tests/data/file.txt

  # Output the stream contents to the screen
  - process.stdout
```

There are all types of stream sources, transforms and ways to write out data, ranging from reading and writing files to working with HTTP API's, CMS's and AWS S3. You can compose complex stream pipelines easily in one file.

You can run import streams in a node environment (tested in latest LTS 10+). Your options are to run with `npx` which makes the command available without any installation as follows:

```shell
$ npx @alpaca-travel/import-streams stream.yaml
```

Otherwise, if you like it and perform regular import streams work, you can install it on your host using npm to install globally. The CLI `import-streams` will become available for you to point at any YAML file.

```shell
$ npm install -g @alpaca-travel/import-streams
$ import-streams stream.yaml
```

## Capabilities

There are a lot of already developed streams available for processing input and sending output. These form a "swiss-army" knife of transform functions making processing data from various sources easier.

- Input/Output Sqlite statements, Read from JSON:API, Fetch HTTP/HTTPS, AWS S3 and local filesystems
- Control flow, combine multiple read/write streams, transform individual values
- Parse/stringify URI, JSON, CSV
- basic type coercion, sprintf
- map, flatten, join, concat
- path selectors, filter expressions
- expressive math, regex, control, combining, string manipulation, membership, existence type, equality
- prettier, html santize
- cipher, zlib/unzip
- ... and Drupal fields, entity references, etc

## Docs

See [docs](https://github.com/AlpacaTravel/import-streams/tree/master/docs)

## Goals

The following goals are behind the import-streams

- Describe simple imports and processing in a readable format (YAML/JSON)
- Provide a comprehensive toolset with the ability to expand your own
- Make mapping data between formats/sources easy
- Leverage streams and tools to handle processing flow
- MIT

## Implementation Overview

- You can describe imports either using YAML, JSON or programatically using typings and steams directly
- Describe the import using various stages, that can define read sources, map/lookup values for fields and write output
- Map fields and properties using 'selectors' as well as transforms that can change the data
- Supply to an exposed 'compose' function that crates the implementation and performs the actions

## Composeable Pipelines

This library offers a way to compose a pipeline of streams.

More complex pipelines can define combined read/write sources, or branch processing based on the intended sources. In order to make it easier to build more complex pipelines that could potentially be defined in a configuration file and unique to the runtime requirements, the `@alpaca-travel/import-streams-compose` was created (which is used by the core import-streams).

The library exposes a `compose` function that can read an object defining simple or complex pipelines you wish to process.

The pipeline can create a set of pipelines "in series" (following the usual read -> (transform) -> write), but also branch and combine from other pipelines that could combine multiple read sources and write to multiple output sources.

Any readable-stream is supported, and you can integrate your own streams into the composition.

This is the basis of creating reusable compositions that could be defined as JSON or YAML.

Features:

- Define stream pipelines
- Combine both read and write streams
- Supports complex branching
- Supports map-reduce patterns as well as other transformations
- Easily provide your own streams for further capabilities

### Importing from a CSV to a collection

```javascript
import compose from "@alpaca-travel/import-streams";

// Using YAML, but can use JSON etc.
const definition = /* YAML */ `
# Example of syncing places from a CSV file
version: 1.0
streams:
  # Obtain the CSV from a URL
  # Place your CSV up somewhere the script can access
  # You can configured options to include fetch options such as headers/auth etc
  - type: fetch-stream
    options:
      url: https://www.example.com/my-place-data.csv

  # Parse the CSV
  # This is a full CSV streaming behaviour, with lots of configurables
  - type: csv-parse
    options:
      columns: 
        # Example CSV File Structure, use your own
        - id
        - last_updated
        - title
        - coords
        # ... other fields etc
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,

  # Map fields into an item structure
  # We can map basics or more complex field and field types
  - type: map-selector
    options:
      template:
        # Build out a data structure supporting the Alpaca Schemas
        $schema: https://schemas.alpaca.travel/item-v1.0.0.schema.json
        resource:
          $schema: https://schemas.alpaca.travel/place-v1.0.0.schema.json
      mapping:
        # Map your columns to the desired locations

        # Map the title to the CSV column "title"
        title: title

        # Obtain a lng/lat from the lng-lat column; e.g. "lng,lat" 
        position:
          path: coords
          transform:
            - type: to-coordinate
            - options:
              # Depending if you use lng/lat or lat/lng
              # flip: true
              # The delimiter, if you use something other than ","
              # delimiter: ";"

        # Syncing fields, this can be used only to update affected records
        modified:
          path: last_updated
          transform:
            - to-date-format
        
        # Map a "custom://external-ref" to your ID to sync
        custom://external-ref: id

        # Assign the source (Recommended to avoid ID conflicts)
        custom://external-source:
          path: .
          transform:
            - type: replace
              options:
                value: https://www.example.com

        # More mapping here....

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
  // eg. parsing your own CSV values into different structures
};

// Compose a stream based on a struct
const stream = compose(definition, { factory }).on("finish", () =>
  console.log("Complete!")
);
```

### Example, sourcing from Drupal using JSON:API core module

The below examples hows leveraging the JSON:API which can be enabled in Drupal in order to read business listings into your Alpaca collection.

```javascript
import compose from "@alpaca-travel/import-streams";

// Example import configuration using import-streams
// You can use YAML, JSON or use exported typescript types
const definition = /* YAML */ `
# Example of syncing records from a Drupal site with the JSON:API core module enabled
# This can support all types of entities and media based on the already available drupal field-types
version: 1.0
streams:
  # Site one source
  # You can combine additional read sources using "combine: ..."
  - type: json-api-object
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
          path: attributes.changed
          transform:
            - to-date-format

        # Parse more complex values with pre-established transforms
        position:
          path: attributes.lngLat
          transform:
            - to-coordinate

        # Parse through multiple streams
        description:
          path:
            - attributes.description
            # support additional selectors with fall-over
          transform:
            # Transform individual values
            - html-sanitize
            - html-prettier
        
        # Support map/reduce on individual fields
        tags:
          path: relationships.field_types
          transform:
            # Leverage pre-existing transforms offered to map data
            - type: drupal.field-types.json-api.entity-reference
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
          path: .
          transform:
            - type: replace
              options:
                value: https://www.site1.com


  # Stream additional phases with transformed docs, etc
  # ...

  # Sync only changed records to a collection, and hide missing
  # Note: You can also combine: to multiple write sources
  - type: alpaca-sync-external-items
    options:
      apiKey: ...
      collection: alpaca://collection/123
      profile: alpaca://profile/XYZ
`;

const factory = ({ type, options }) => {
  // return my own streams here to mix them in
};

// Compose a stream based on a struct
const stream = compose(definition, { factory }).on("finish", () =>
  console.log("Complete!")
);
```
