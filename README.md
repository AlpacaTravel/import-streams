# import-streams

[![Build Status](https://travis-ci.com/AlpacaTravel/import-streams.svg?branch=master)](https://travis-ci.com/AlpacaTravel/import-streams)[![Coverage Status](https://coveralls.io/repos/github/AlpacaTravel/import-streams/badge.svg?branch=master)](https://coveralls.io/github/AlpacaTravel/import-streams?branch=master)![MIT](https://img.shields.io/npm/l/@alpaca-travel/import-streams)[![npm](https://img.shields.io/npm/v/@alpaca-travel/import-streams)](https://www.npmjs.com/package/@alpaca-travel/import-streams)

This project is currently in a Alpha Preview release.

A simple tool that describes streams to process imports or data processing in YAML/JSON.

It is built to help transform data between formats and sources, such as reading in data from any source, transforming it to the required format, and writing it to another location.

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
- JSON schema validation
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

## AWS Lambda Runtime

AWS Lambda can provide a friendly runtime environment in order to host your regular ongoing import processes. You can build your import using the `serverless` framework, or leverage the following layer ARN

Layer ARN

```
arn:aws:lambda:ap-southeast-2:353721752909:layer:import-streams:2
```

### Step by step guide to create a AWS lambda import-streams

It can be quick and easy to create a lambda leveraging the shared layer. This allows you to use a simple script and yaml file without any installation in order to run your import on a cron-like schedule.

#### Creating the lambda function

1. Log into Amazon Web Services
2. Go to Lambda
3. Click "Create Function"
4. Select "Author from scratch"
5. Enter the name of your lambda function, such as "example-import-stream"
6. Chose the runtime of "Node.js 10.x"
7. Select "Create Function"
8. Select "Layers" from the Designer
9. Select "Add a layer"
10. Select "Provide a layer version ARN"
11. Enter the Layer ARN (as shown above) into the field
12. Click "Add"

#### Adding the script

In the section titled "Function code", replace the index.js source code with:

```javascript
// This is available when the layer is added without
const compose = require("@alpaca-travel/import-streams").default;

// This is the default handler
module.exports.handler = async () => {
  // Obtain the stream path
  const resolved = require("path").resolve("./stream.yaml");

  try {
    // Include the source
    const source = require("fs").readFileSync(resolved, "utf-8");

    // Process
    await new Promise((success, fail) => {
      // This does out compose
      compose(source).on("finish", success).on("error", fail);
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
```

Then, create a script beside the index.js file named "stream.yaml" and paste your stream yaml contents.

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

Finally, save your lambda function and test it out. You will see the words "Hello import-streams, you are running!" once it is operating.

Your final steps may be; extending the script exection from 3 seconds to something longer (such as 5 minutes or more), or setting up a trigger (such as CloudWatch Events for a schedule).
