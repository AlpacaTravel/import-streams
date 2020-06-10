# JSON Schema Validate

A transform stream that can be used to validate an object against a JSON schema. The behaviour is by default to raise an exception, but can be used to filter out elements in the stream that are invalid based on not passing the json schema definition.

Features:

- Support for draft-04/06/07
- Can define json schema in place, or refer to remote URL to obtain schema
- Can be used to filter objects in stream, or throw exceptions
- Detailed debug for validating failures
- Can target parts of your object by supplying a path, or iterate over a collection withing your stream object
- Can automatically detect and obtain schemas from \$schema defined in object

## Usage

```yaml
version: 1.0

stream:
  # Take some objects in a stream
  - type: object
    options:
      value:
        - firstName: John
          lastName: Doe
          age: 21
        - firstName: Cam
          lastName: Manderson
          age: -1

  # Validate them through the json-schema-validate behaviour
  - type: json-schema-validate
    options:
      # Optional:

      # Filter invalid objects
      # Either filter out objects from the stream or throw exception (default throws)
      filter: true

      # Specify the path to the object to validate
      # path: path.to.object

      # Iterate over the objects
      # allowing you to validate an array on the object against the schema
      # iterate: true

      # Automatically obtain the schema from the $schema on the object
      # detect: true

      # Specify the definition as a URL or inline
      # definition: https://someplace.com/schema.schema.json
      definition:
        $id: https://example.com/person.schema.json
        $schema: http://json-schema.org/draft-07/schema#
        title: Person
        type: object
        properties:
          firstName:
            type: string
            description: The person's first name.
          lastName:
            type: string
            description: The person's last name.
          age:
            description: Age in years whihc must be equal to or greater than zero.
            type: integer
            minimum: 0

      # Debug
      # Use the console.log to show validation errors
      # Including the schema, object and list of errors
      debug: true

  # Expect only one result here
  - console
```
