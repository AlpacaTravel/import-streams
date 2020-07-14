import { Transform as StreamTransform } from "readable-stream";
import * as _ from "lodash";

import { TransformFunction, TransformFunctionOptions } from "../types";
import processSelector, { Selector } from "./selector";
import { assertValidTransformOptions } from "../assertions";

export interface MapSelectorOptions extends TransformFunctionOptions {
  mapping: Mapping;
  attributeLocale?: string;
  template?: any;
  useValueAsTemplate?: boolean;
}

export interface Mapping {
  [key: string]: Selector;
}

interface Attribute {
  $ref: String;
}

interface AttributeDefinition {
  attribute: Attribute;
  value?: any;
  locale?: string;
}

export interface MappedObject {
  [key: string]: any;

  attributes?: Array<AttributeDefinition>;
}

type Callback = (error?: Error) => undefined;

export const createTransformStream = (options: MapSelectorOptions) => {
  return new StreamTransform({
    objectMode: true,

    transform(value: any, _, callback: Callback) {
      (async () => {
        try {
          // Transform the value
          const transformedValue = await mapSelector(value, options);

          this.push(transformedValue);

          // Return the value
          callback();
        } catch (e) {
          // Capture the error
          callback(e);
        }
      })();
    },
  });
};

const mapSelector: TransformFunction<MappedObject, MapSelectorOptions> = async (
  value: any,
  options: MapSelectorOptions
): Promise<MappedObject> => {
  assertValidTransformOptions(
    options,
    ["mapping", "attributeLocale", "template", "useValueAsTemplate"],
    "map-selector"
  );

  const { mapping = {}, attributeLocale = null, context } = options;

  // The mapped object keys
  const keys = Object.keys(mapping);

  // For each of the keys...
  const processKeyValueTasks = keys.map((key) =>
    processSelector(value, {
      selector: mapping[key],
      context,
    })
  );

  // Create a new mapped object
  const values = await Promise.all(processKeyValueTasks);

  // Create the map template
  const template = (() => {
    if (options && options.useValueAsTemplate) {
      return _.cloneDeep(value);
    }

    if (options && options.template) {
      return options.template;
    }

    return {};
  })();

  return keys.reduce((obj: MappedObject, key: string, i: number) => {
    const clone: MappedObject = _.clone(obj);
    // Standard prop
    if (!/^[^:]+:\/\/.+$/.test(key)) {
      _.set(clone, key, values[i]);
      return clone;
    }

    // Attribute definition appears as a protocol
    const attributes = clone.attributes || [];
    const attribute: AttributeDefinition = (() => {
      const current = attributes.find(
        (att) =>
          att.attribute.$ref === key &&
          (!attributeLocale || att.locale === attributeLocale)
      );
      if (current) {
        return current;
      }

      const attributeDefinition: AttributeDefinition = {
        attribute: {
          $ref: key,
        },
        value: undefined,
      };
      if (attributeLocale) {
        attributeDefinition.locale = attributeLocale;
      }

      return attributeDefinition;
    })();

    // Set the value
    attribute.value = values[i];

    // Add back into the attributes
    Object.assign(clone, {
      attributes: attributes.filter((a) => a !== attribute).concat([attribute]),
    });

    return clone;
  }, template);
};

export default mapSelector;
