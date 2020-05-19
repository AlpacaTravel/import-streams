# import-streams

[![Build Status](https://travis-ci.com/AlpacaTravel/import-streams.svg?branch=master)](https://travis-ci.com/AlpacaTravel/graph-sdk)[![Coverage Status](https://coveralls.io/repos/github/AlpacaTravel/import-streams/badge.svg?branch=master)](https://coveralls.io/github/AlpacaTravel/graph-sdk?branch=master)![MIT](https://img.shields.io/npm/l/@alpaca-travel/import-streams)

This project is currently in a Alpha Preview release.

A set of libraries ot assist import related tasks, assisting importing (or exporting) from one source (such as drupal or other API) to (or from) the Alpaca API.

Features:

- Read sources include JSON:API, which comes as a core module in Drupal v8 (and as an extension module to v9)
- Can process various field types, entity references and process image types
- Can sync from one or more sources into a one or more output destinations, such as the Alpaca Collections

## Outline of Streams

## Composeable Pipelines

More complex pipelines can define combined read/write sources, or branch processing based on the intended sources. In order to make it easier to build more complex pipelines that could potentially be defined in a configuration file and unique to the runtime requirements, the `@alpaca-travel/import-streams-compose` was created. The library exposes a `compose` function that can read an object defining simple or complex pipelines you wish to process.

The pipeline can create a set of pipelines "in series" (following the usual read -> (transform) -> write), but also branch and combine from other pipelines that could combine multiple read sources and write to multiple output sources.

This is the basis of creating reusable compositions that could be defined as JSON or YAML.

```javascript
import compose from "@alpaca-travel/import-streams-compose";
import fs from "fs";

// Streams to pipe on top of each other
// { type: ..., options: ... } - a basic stream
// { stream: [...] } - A series of pipelines
// { combine: [{ stream: [...]}, {type:..., options}, {combine: [...]}] } - Combining inputs/outputs
const struct = {};

const factory = ({ type, options }) => {
  // return my stream
};

// Compose a stream based on a struct
const stream = compose(struct, { factory });
```
