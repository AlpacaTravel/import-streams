import { Writable, Readable, Transform, Stream } from "readable-stream";
import MultiReadStream from "multistream";
import MultiWriteStream from "multi-write-stream";
import assert from "assert";

export interface StreamFactoryOptions {}

export type SupportedStream = Readable | Transform | Writable;

export interface CombineStreamOptions {
  objectMode?: boolean;
}

export interface CombineStreamDefinition {
  combine: ComposableDefinition | ComposableDefinition[];
  options?: CombineStreamOptions;
}

export interface ComposableStreamDefinition {}

export interface ComposableStreamDefinition {
  stream: ComposableDefinition | ComposableDefinition[];
  options?: CombineStreamOptions;
}

export interface StreamDefinition {
  type: string;
  options?: StreamFactoryOptions;
}

export type ComposableDefinition =
  | StreamDefinition
  | ComposableStreamDefinition
  | CombineStreamDefinition
  | string
  | Array<
      | StreamDefinition
      | ComposableStreamDefinition
      | CombineStreamDefinition
      | string
    >;

export type StreamFactory = (
  streamDefinition: StreamDefinition
) => SupportedStream;

const asReadablePipeTypes = (stream: SupportedStream): Readable => {
  if (isReadable(stream)) {
    return stream;
  }
  throw new Error("Should not stream from a writable stream");
};

const asWritablePipeType = (stream: SupportedStream): Transform | Writable => {
  if (isWritable(stream)) {
    return stream;
  }

  throw new Error("Should not stream to a readable stream");
};

const isWritable = (stream: SupportedStream): stream is Writable => {
  if (stream instanceof Writable || stream instanceof Transform) {
    return true;
  }
  if (stream instanceof Stream && "writable" in stream) {
    return true;
  }

  return false;
};

const isReadable = (stream: SupportedStream): stream is Readable => {
  if (stream instanceof Readable || stream instanceof Transform) {
    return true;
  }

  return false;
};

const isStreamDefinition = (
  tbd: ComposableDefinition
): tbd is StreamDefinition => {
  if (Array.isArray(tbd) || typeof tbd === "string") {
    return false;
  }
  if ("type" in tbd) {
    return true;
  }
  return false;
};

const isCombineStreamDefinition = (
  tbd: ComposableDefinition
): tbd is CombineStreamDefinition => {
  if (Array.isArray(tbd) || typeof tbd === "string") {
    return false;
  }
  if ("combine" in tbd) {
    return true;
  }
  return false;
};

const isComposableStreamDefinition = (
  tbd: ComposableDefinition
): tbd is ComposableStreamDefinition => {
  if (typeof tbd === "string" || Array.isArray(tbd)) {
    return false;
  }
  if ("stream" in tbd || "combine" in tbd) {
    return true;
  }
  return false;
};

export interface ComposeOption {
  factory: StreamFactory;
}

interface HeadTailStream {
  head: SupportedStream;
  tail: SupportedStream;
}

const compose = (
  definition: ComposableDefinition,
  options: ComposeOption
): SupportedStream => {
  assert(
    options && typeof options.factory === "function",
    "Missing required factory method for creating factory"
  );

  // Options
  if (isComposableStreamDefinition(definition) || Array.isArray(definition)) {
    // Obtain the stream
    const stream = (() => {
      // If an array, treat as a stream
      if (Array.isArray(definition)) {
        return definition;
      }

      // Return the standard
      return definition.stream;
    })();

    if (stream) {
      // Create a piped set of stream
      const streams = Array.isArray(stream) ? stream : [stream];
      const result = streams.reduce((prior: null | HeadTailStream, subdef) => {
        const nextStream = compose(subdef, options);
        if (prior == null) {
          return { head: nextStream, tail: nextStream };
        }

        if (!isReadable(prior.tail)) {
          throw new Error(`Can not pipe on top of a non-readable prior stream`);
        }

        if (!isWritable(nextStream)) {
          throw new Error(`Can not pipe into a non-writable stream`);
        }

        const { head, tail } = prior;
        return { head, tail: tail.pipe(asWritablePipeType(nextStream)) };
      }, null);

      if (result) {
        // If we have defined a writable pipe as the head, return that reference
        if (isWritable(result.head)) {
          return result.head;
        }
        // If we have a
        return result.tail;
      }
    }
  }

  if (isCombineStreamDefinition(definition)) {
    const { combine, options: combineOptions } = definition;
    if (combine) {
      // Support for object mode can be determined for the collection
      const { objectMode } = combineOptions || { objectMode: true };

      // Create a combined stream
      const combines = Array.isArray(combine) ? combine : [combine];
      const combinableStreams: SupportedStream[] = combines.map(
        (subdef: ComposableDefinition) => {
          return compose(subdef, options);
        }
      );

      // Check to make sure we have a combine defined
      if (combinableStreams.length) {
        // If we have a readable set of streams
        if (combinableStreams.every((stream) => isReadable(stream))) {
          const readableStreams = combinableStreams.map((s) =>
            asReadablePipeTypes(s)
          );
          if (objectMode === true) {
            return MultiReadStream.obj(readableStreams);
          }
          return new MultiReadStream(readableStreams);
        }

        // If we have a writable set of streams
        if (combinableStreams.every((stream) => isWritable(stream))) {
          const writableStreams = combinableStreams.map((s) =>
            asWritablePipeType(s)
          );
          if (objectMode === true) {
            return MultiWriteStream.obj(writableStreams);
          }
          return new MultiWriteStream(writableStreams);
        }

        throw new Error(
          "Unable to combine read and writable streams in the same stream"
        );
      }
    }
  }

  if (isStreamDefinition(definition) || typeof definition === "string") {
    const factoryDefinition = (() => {
      if (typeof definition === "string") {
        return { type: definition };
      }

      return definition;
    })();

    // Create a basic stream
    return options.factory(factoryDefinition);
  }

  throw new Error("Missing either a stream, combine or type definition");
};

export default compose;
