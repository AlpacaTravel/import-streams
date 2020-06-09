# Import Streams Documentation

Import Streams offers a 'swiss army' knife of streams that can be used for various data transformation and import/export options. These provide a baseline for your pipeline, but can be extended for your domain problem.

## Core Streams

### Read Streams

#### Amazon Web Services

Read streams for AWS S3 Storage

| type                     | overview                                                              |
| ------------------------ | --------------------------------------------------------------------- |
| aws-s3-get-object-stream | Create a stream from an object stored in AWS S3                       |
| aws-s3-get-object        | Stream object (string/json object(s)) from an object stored in AWS S3 |
| aws-s3-list-objects      | Stream a list of object references that exist in a bucket             |

#### Fetch

Read from HTTP End-points

| type         | overview                                                                                |
| ------------ | --------------------------------------------------------------------------------------- |
| fetch-object | Stream object (string/json object(s)) from a URL or series of paginatable URL endpoints |
| fetch-stream | Stream a URL body                                                                       |

#### File System

Read streams for reading from the local filesystem

| type             | overview                               |
| ---------------- | -------------------------------------- |
| file-read-stream | Reads a file from the local filesystem |

#### JSON:API

Read objects from a JSON:API end-point

| type            | overview                                   |
| --------------- | ------------------------------------------ |
| json-api-object | Stream object(s) from a JSON:API end-point |

#### Sqlite Database

| type                    | overview                                 |
| ----------------------- | ---------------------------------------- |
| sqlite-statement-object | Stream object(s) from a Sqlite statement |

### Transform Streams (read/write streams)

#### Amazon Web Services

| type                             | overview                                          |
| -------------------------------- | ------------------------------------------------- |
| resolve-aws-s3-get-object-stream | Resolve the value into a S3 object stream         |
| resolve-aws-s3-get-object        | Resolve the value into a object(s) stream from S3 |

#### Cryptography

| type           | overview                                       |
| -------------- | ---------------------------------------------- |
| crypto-decrypt | Decrypt stream based on algorithm and password |
| crypto-encrypt | Encrypt stream based on algorithm and password |

#### CSV (Comma/Delimiter Seperated Values)

Working with delimeter seperated values

| type          | overview                                     |
| ------------- | -------------------------------------------- |
| csv-parse     | Parse stream as CSV to obtain array/objects  |
| csv-stringify | Create a CSV based on supplied array/objects |

#### Fetch

| type                 | overview                                                  |
| -------------------- | --------------------------------------------------------- |
| resolve-fetch-object | Resolve the value into a object(s) stream from HTTP/HTTPS |

#### Fexp-js

Fexp-js provides a way to evaluate or process a value, such as using control flow, matching, math functions and more.

| type | overview                                                   |
| ---- | ---------------------------------------------------------- |
| fexp | Perform a fexp (containing standard lib) function on value |

#### Filter

| type        | overview                                                     |
| ----------- | ------------------------------------------------------------ |
| filter-fexp | Filter supplied stream objects based on a fexp-js expression |
| skip        | Skip a number of objects in the stream                       |

#### HTML

| type                 | overview                                |
| -------------------- | --------------------------------------- |
| html-entities-decode | Decodes HTML entities                   |
| html-prettier        | Prettier HTML from stream               |
| html-sanitize        | Attempt sanitize for supplier html text |
| html-text            | Strip tags from HTML                    |

#### JSON

| type           | overview                       |
| -------------- | ------------------------------ |
| json-parse     | Parse stream as JSON           |
| json-stringify | Format streamed object as JSON |

#### Map functions

| type         | overview                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| each         | Iterate over an array of values                                                                       |
| map-selector | Map object properties via a path selector and invoke transforms on values                             |
| selector     | Select a path to a property on an object, and map/transform that value to a new property on an object |

#### Reduce functions

| type    | overview                                      |
| ------- | --------------------------------------------- |
| concat  | Reduce stream into an array                   |
| flatten | Reduce an object or array into a single value |
| join    | Join an array into a single value             |

#### String Transformations

| type             | overview                                      |
| ---------------- | --------------------------------------------- |
| base64-encode    | Encode given string as base64                 |
| base64-decode    | Decode given string from base64               |
| sprintf          | Format value based on sprintf supplied format |
| string-lowercase | Make the string lowercase                     |
| string-uppercase | Make the string uppercase                     |
| truncate         | Truncate an input text at a position          |

#### Type Cooercion

Coerce types of input

| type           | overview                                                    |
| -------------- | ----------------------------------------------------------- |
| to-boolean     | Coerce value into a boolean                                 |
| to-coordinate  | Coerce value into a coordinate [x,y] or [long, lat]         |
| to-date-format | Coorce value into a date format (e.g. timestamp or iso8601) |
| to-number      | Coerce value into a number                                  |
| to-url         | Coerce value into a url (prefix it http/https)              |

#### URI

Working with URIs

| type      | overview                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| uri-parse | Parse a supplied URI into components, such as scheme, hostname, path, post and query |

### ZLib / Unzip / Archive

Performs compression/decompression using the zlib library

| type      | overview                                    |
| --------- | ------------------------------------------- |
| gunzip    | Inflates a stream                           |
| gzip      | Deflates a stream                           |
| unzip-one | Select a file from a zip archive and stream |

### Write Streams

#### File System

| type              | overview                              |
| ----------------- | ------------------------------------- |
| file-write-stream | Writes a file to the local filesystem |

#### Process

| type           | overview                         |
| -------------- | -------------------------------- |
| process.stdout | Output stream to standard output |

#### Sqlite Statement

| type             | overview                                        |
| ---------------- | ----------------------------------------------- |
| sqlite-statement | Execute a SQL statement with the streamed value |

### Debug

An additional couple of streams can be useful for diagnosing issues

| type    | overview                                             |
| ------- | ---------------------------------------------------- |
| console | Calls console.log with the value, and passes through |

## Drupal Streams

A set of streams for reading from Drupal field structures

### Transform Streams

| type                                         | overview                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| drupal.field-types.address-field             | Convert a address field to a address format object                                                                       |
| drupal.field-types.boolean                   | Convert a boolean field value into a boolean                                                                             |
| drupal.field-types.email                     | Convert an email address field value into a string                                                                       |
| drupal.field-types.geofield                  | Convert a geofield into a coordinate                                                                                     |
| drupal.field-types.link                      | Convert a link to a url                                                                                                  |
| drupal.field-types.telephone                 | Convert a telephone input into a telephone number                                                                        |
| drupal.field-types.text-formatted            | Obtain the value for a formatted text field                                                                              |
| drupal.field-types.text-plain                | Obtain the plain text value                                                                                              |
| drupal.field-types.json-api.entity-reference | Resolve the entity reference using json-api                                                                              |
| drupal.field-types.json-api.image            | Resolve the entity reference into an alpaca media format (including multiple image sizes/outputs and the original media) |

## Alpaca Streams

A set of streams capable of working with Alpaca Public API

### Read Streams

| type           | overview                                                |
| -------------- | ------------------------------------------------------- |
| alpaca-journey | Obtains a journey based on a supplied journey reference |

### Transform Streams

| type                   | overview                                               |
| ---------------------- | ------------------------------------------------------ |
| resolve-alpaca-journey | Take a value and resolve the associated alpaca journey |

### Write Streams

| type                       | overview                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| alpaca-sync-external-items | A sync write stream that can identify and update items in a collection |
