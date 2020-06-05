# Unzip one

Creates a read stream to the first (matching) file in a supplied zip.

## Usage

```yaml
version: 1.0

stream:
  - type: fetch-stream
    options:
      url: http://spatialkeydocs.s3.amazonaws.com/FL_insurance_sample.csv.zip

  - type: unzip-one
    options:
      # Optional, select the file from the zip based on the supplied regex
      regex: .*.csv
      regexFlags: i

  - csv-parse
  - console
```
