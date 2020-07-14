# Set

Sets a property of an object in the stream based on a specific value provided

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

  - type: set
    options:
      path: foo
      value: bar
```
