import { Transform } from "readable-stream";
import Ajv from "ajv";
import processSelector from "../selector";
import { TransformOptions, Callback } from "../types";
import network from "../network";

// Add in a JSON schema validate, to ensure that objects can meet a requirement
// Support an inline, or external definition
// Support auto-detect
// Support filter versus exception
// Support debug

interface JsonSchemaValidateOptions extends TransformOptions {
  definition?: string | any;
  detect?: boolean;
  filter?: boolean;
  debug?: boolean;
  path?: string;
  iterate?: boolean;
}

export default class JsonSchemaValidate extends Transform {
  private definition?: string | any;
  private detect: boolean;
  private filter: boolean;
  private useDebug: boolean;
  private resolvedSchemas: Map<string, any>;
  private ajv: Ajv.Ajv;
  private path?: string;
  private iterate: boolean;

  constructor(options: JsonSchemaValidateOptions) {
    super({ objectMode: true });

    const {
      definition,
      detect = true,
      filter = false,
      debug = false,
      path,
      iterate = true,
    } = options;

    this.useDebug = debug;
    this.filter = filter;
    this.detect = detect;
    this.definition = definition;
    this.path = path;
    this.iterate = iterate;

    this.resolvedSchemas = new Map();
    this.ajv = new Ajv();
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("json-schema-validate", ...args);
    }
  }

  async getSchema(object: any) {
    const schema = (() => {
      if (this.detect === true && object.$schema) {
        return object.$schema;
      }
      if (this.definition) {
        return this.definition;
      }
    })();

    if (typeof schema === "object") {
      return schema;
    }

    if (typeof schema === "string") {
      if (this.resolvedSchemas.has(schema)) {
        return this.resolvedSchemas.get(schema);
      }

      this.debug("Fetching the schema from the network", schema);
      const resolvedSchema = await network.objectRead(schema, {
        method: "get",
      });
      this.resolvedSchemas.set(schema, resolvedSchema);
      return resolvedSchema;
    }
  }

  _transform(object: any, _: string, cb: Callback) {
    (async () => {
      try {
        const selected = (() => {
          if (this.path) {
            return processSelector(this.path, object);
          }
          return object;
        })();

        const schema = await this.getSchema(selected);
        if (!schema) {
          throw new Error("Missing the json schema definition");
        }

        if (schema) {
          const valid = (() => {
            if (Array.isArray(selected) && this.iterate === true) {
              return selected.reduce((c, t) => {
                if (!c) {
                  return false;
                }

                return this.ajv.validate(schema, t);
              }, true);
            }
            return this.ajv.validate(schema, selected);
          })();
          if (valid === false) {
            this.debug(
              "Validation result: INVALID",
              "Schema:",
              JSON.stringify(schema),
              "Object:",
              JSON.stringify(selected),
              "Errors:",
              JSON.stringify(this.ajv.errors)
            );
          }
          if (this.filter === true) {
            if (valid === true) {
              this.push(object);
            } else {
              this.debug("Filtering out result");
            }
          } else {
            if (valid === false) {
              throw new Error("JSON Schema Validation failed");
            }
          }
        }
        cb();
      } catch (e) {
        this.debug(e);
        cb(e);
      }
    })();
  }
}
