# Sqlite Statement Read

This readable stream will prepare a Sqlite statement exec to obtain all results. The resulting rows are streamed.

## Usage

```yaml
version: 1.0

stream:
  # Read in a CSV
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

  # Create a write stream for writing the SQL elements
  - type: sqlite-statement-write
    options:
      # Required:
      database: ./sqlite-database.db
      sql: INSERT INTO example (policy_id, point_latitude, point_longitude) VALUES (@policyID, @point_latitude, @point_longitude)
      # Optional
      debug: true
```

Example database..

```sql
CREATE TABLE "example" (
	"policy_id"	INTEGER NOT NULL,
	"point_latitude"	NUMERIC NOT NULL,
	"point_longitude"	NUMERIC NOT NULL,
	PRIMARY KEY("policy_id")
);
```
