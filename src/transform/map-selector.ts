import { Transform as StreamTransform } from "stream";
import * as _ from "lodash";

import { TransformFunction, TransformFunctionOptions } from "../types";
import processSelector, { Selector } from "./selector";

export interface MapSelectorOptions extends TransformFunctionOptions {
  mapping: Mapping;
  attributeLocale?: string;
  template?: any;
}

export interface Mapping {
  [key: string]: Selector;
}

`
  business:
    title: title

    title:
      selector: title
      transform: text

    otherTitle:
      selector:
        - title
        - something
      transform:
      - text
      - url
    
    media:
      selector: abc
      transform:
        - type: mapTransform
          options:
            mapping: selector
            
`;

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
          const transformedValue = await mapTransform(value, options);

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

const mapTransform: TransformFunction<
  MappedObject,
  MapSelectorOptions
> = async (value: any, options: MapSelectorOptions): Promise<MappedObject> => {
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
    if (options && options.template) {
      return options.template;
    }

    return {};
  })();

  return keys.reduce((obj: MappedObject, key: string, i: number) => {
    const clone: MappedObject = JSON.parse(JSON.stringify(obj));
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

export default mapTransform;
