import compose, {
  StreamDefinition,
  ComposableStreamDefinition,
  CombineStreamDefinition,
  SupportedStream,
  StreamFactory,
  StreamFactoryOptions,
  ComposableDefinition,
} from "@alpaca-travel/import-streams-compose";
import assert from "assert";
import { Transform } from "readable-stream";

import transforms from "./transform/index";
import { createReadStream as createJsonApiDataReadStream } from "./read/json-api-data";
import { createTransformStream as createMapSelectorTransformStream } from "./transform/map-selector";
import { createWriteStream as createSyncExternalItemsWriteStream } from "./write/sync-external-items";

export {
  // Read Streams
  createJsonApiDataReadStream,
  // Transform Streams
  transforms,
  createMapSelectorTransformStream,
  // Write Streams
  createSyncExternalItemsWriteStream,
};

type Callback = (error?: Error) => undefined;

interface StreamDefinitionDocument extends StreamDefinition {
  version: string | number;
}
interface ComposableStreamDefinitionDocument
  extends ComposableStreamDefinition {
  version: string | number;
}

interface CombineStreamDefinitionDocument extends CombineStreamDefinition {
  version: string | number;
}

type Document =
  | StreamDefinitionDocument
  | ComposableStreamDefinitionDocument
  | CombineStreamDefinitionDocument;
interface Options {
  factory?: StreamFactory;
}

interface JsonApiDataOptions extends StreamFactoryOptions {
  url: string;
  limit?: number;
}

const isJsonApiDataOptions = (
  options?: StreamFactoryOptions
): options is JsonApiDataOptions => {
  if (!options) {
    return false;
  }
  if ("url" in options) {
    return true;
  }
  return false;
};

interface SyncExternalItemsOptions extends StreamFactoryOptions {
  apiKey: string;
  collection: string;
  profile: string;
}

const isSyncExternalItemsOptions = (
  options?: StreamFactoryOptions
): options is SyncExternalItemsOptions => {
  if (!options) {
    return false;
  }
  if ("mapping" in options && "apiKey" in options && "profile" in options) {
    return true;
  }
  return false;
};

export const createCompose = (options?: Options) => {
  const factory: StreamFactory = (
    stream: StreamDefinition
  ): SupportedStream => {
    // Check if our calling library has the ability to create the stream
    if (options && options.factory) {
      const resultingStream = options.factory(stream);
      if (resultingStream) {
        return resultingStream;
      }
    }

    // Attempt to create the factory ourselves
    switch (stream.type) {
      case "json-api-data": {
        if (isJsonApiDataOptions(stream.options)) {
          assert(
            stream.options.url,
            "Missing the URL for the JsonApiData service"
          );

          // Create the read stream
          return createJsonApiDataReadStream(stream.options.url, {
            limit: stream.options.limit,
          });
        }
        throw new Error(
          "Missing the configuration for JsonApiData options, should have: url"
        );
      }

      case "sync-external-items": {
        if (isSyncExternalItemsOptions(stream.options)) {
          assert(
            stream.options.collection,
            "Missing the collection in options"
          );
          assert(stream.options.apiKey, "Missing the apiKey in options");
          assert(stream.options.profile, "Missing the profile in options");

          // Create the collection write stream
          return createSyncExternalItemsWriteStream({
            collection: stream.options.collection,
            apiKey: stream.options.apiKey,
            profile: stream.options.profile,
          });
        }

        throw new Error(
          "Missing the configuration in SyncExternalItems options, should have: apiKey, collection and profile"
        );
      }

      default:
        // Check if we have defined the stream type as a transform
        if (stream.type in transforms) {
          const transform = transforms[stream.type];

          // Create a transform
          return new Transform({
            objectMode: true,

            transform(value: any, _, callback: Callback) {
              (async () => {
                try {
                  // Interleave a context into the object
                  const interleavedContext = {
                    context: {
                      compose: composeWithOptions,
                    },
                  };

                  // Options
                  const transformOptions = Object.assign(
                    {},
                    interleavedContext,
                    stream.options
                  );

                  // Transform the value
                  const transformedValue = await transform(
                    value,
                    transformOptions
                  );

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
        }

        break;
    }

    // No stream is available matching this type
    throw new Error(
      `Unrecognised stream type: "${stream.type}". Implement this through the { factory } option when calling compose`
    );
  };

  const composeWithOptions = (
    definition: ComposableDefinition
  ): SupportedStream => {
    return compose(definition, { factory });
  };

  return composeWithOptions;
};

const composition = (doc: Document, options?: Options) => {
  // Doc version check
  const { version } = doc || {};
  assert(
    version === 1 || version === "1.0" || version === "1.0.0",
    "Invalid source version, must be 1.0"
  );

  // Build and execute the compose
  return createCompose(options)(doc);
};

export default composition;
