import assert from "assert";
import {
  Transform,
  TransformFunction,
  TransformOptions as CoreTransformOptions,
  TransformReference,
  TransformFactory,
} from "../types";

export interface TransformOptions extends CoreTransformOptions {
  transform: Transform;
}

const transform: TransformFunction<any, TransformOptions> = async (
  value: any,
  options: TransformOptions
): Promise<any> => {
  const { transform, context } = options;
  const { transforms: library } = context;

  // Support multiple transforms constistently
  const transforms: Array<TransformReference> = Array.isArray(transform)
    ? transform
    : [transform];

  // Become consistent transform factories
  const transformFactories: Array<TransformFactory> = transforms.map(
    (transform) => {
      if (typeof transform === "string") {
        return {
          type: transform,
        };
      }
      return transform;
    }
  );

  // We should define all our transform factory types
  assert(
    transformFactories.every(
      (transformFactory: TransformFactory) =>
        typeof transformFactory.type === "string"
    ),
    "Only supports transforms by string"
  );

  // Ensure that all our transformation elements are present in runtime
  transformFactories.forEach((transformFactory) => {
    assert(
      typeof library[transformFactory.type] === "function",
      `Missing the transform function ${transformFactory.type} in context`
    );
  });

  // Use the transformations to process
  const transformedValue = await transformFactories.reduce(
    async (prior: Promise<any>, transformFactory: TransformFactory) => {
      const transformingValue = await prior;

      const transformOptions = Object.assign(
        {},
        { context },
        transformFactory.options
      );

      return library[transformFactory.type](
        transformingValue,
        transformOptions
      );
    },
    Promise.resolve(value)
  );

  return transformedValue;
};

export default transform;
