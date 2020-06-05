# Unzip one

Creates a read stream to the first (matching) file in a supplied zip.

## Usage

```yaml
version: 1.0

stream:
  # Fetch a stream to a zip file
  - type: fetch-stream
    options:
      url: http://spatialkeydocs.s3.amazonaws.com/FL_insurance_sample.csv.zip

  # Unzip one file from the archive
  - type: unzip-one
    options:
      # Optional, select the file from the zip based on the supplied regex
      regex: \.csv$
      regexFlags: i

  # Parse the csv
  - type: csv-parse
    options:
      columns: true
      quote: '"'
      ltrim: true
      rtrim: true
      delimiter: ,

  - console
```
