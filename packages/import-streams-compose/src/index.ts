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
  | SupportedStream
  | string
  | Array<
      | StreamDefinition
      | ComposableStreamDefinition
      | CombineStreamDefinition
      | SupportedStream
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

const isWritable = (stream: any): stream is Writable => {
  if (typeof stream === "undefined") {
    return false;
  }
  if (stream instanceof Writable || stream instanceof Transform) {
    return true;
  }
  if (stream instanceof Stream && "writable" in stream) {
    return true;
  }

  return false;
};

const isTransform = (stream: any): stream is Transform => {
  return (
    (isWritable(stream) && isWritable(stream)) || stream instanceof Transform
  );
};

const isReadable = (stream: any): stream is Readable => {
  if (typeof stream === "undefined") {
    return false;
  }
  if (stream instanceof Readable || stream instanceof Transform) {
    return true;
  }

  return false;
};

const isSupportedStream = (tbd: any): tbd is SupportedStream => {
  if (
    tbd instanceof Stream ||
    tbd instanceof Readable ||
    tbd instanceof Writable ||
    tbd instanceof Transform
  ) {
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
  readFrom?: Readable;
  head?: boolean;
}

interface HeadTailStream {
  head: SupportedStream;
  tail: SupportedStream;
}

// const compose = (definition:ComposableDefinition, options:ComposeOption) => compose(definition, undefined, options);

const optionsWithReadFrom = (
  options: ComposeOption,
  readFrom?: Readable
): ComposeOption => {
  return Object.assign({}, options, {
    readFrom: readFrom != null ? readFrom : null,
  });
};

const compose = (
  definition: ComposableDefinition,
  options: ComposeOption
): SupportedStream => {
  assert(options, "Missing the options");
  assert(
    typeof options.factory === "function",
    "Missing required factory method for creating factory"
  );
  if (options && options.readFrom != null) {
    assert(
      isReadable(options.readFrom),
      "Options readFrom should be a readable source"
    );
  }

  const { readFrom, factory } = options;

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
        let nextStream = null;
        // If first time
        if (prior === null) {
          nextStream = compose(subdef, optionsWithReadFrom(options, readFrom));
        } else {
          if (!isReadable(prior.tail)) {
            throw new Error(
              `Can not pipe on top of a non-readable prior stream`
            );
          }
          nextStream = compose(
            subdef,
            optionsWithReadFrom(options, prior.tail)
          );
        }

        if (prior == null) {
          return { head: nextStream, tail: nextStream };
        }

        if (!isWritable(nextStream)) {
          throw new Error(`Can not pipe into a non-writable stream`);
        }

        return { head: prior.head, tail: asWritablePipeType(nextStream) };
      }, null);

      // If we are in a write-end stream (not a transform)
      if (result && isWritable(result.head) && !isReadable(result.tail)) {
        return result.head;
      }

      // Return the tail result
      if (result && result.tail) {
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
      if (combines.length) {
        const combinableStreams: SupportedStream[] = combines.map(
          (subdef: ComposableDefinition) => {
            if (isSupportedStream(subdef)) {
              return subdef;
            }
            return compose(subdef, optionsWithReadFrom(options, undefined));
          }
        );

        const nextStream = (() => {
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
        })();

        if (readFrom != null) {
          if (!isWritable(nextStream)) {
            throw new Error(
              "Supplied a stream to combine that is not writable to receive options.readFrom"
            );
          }
          readFrom.pipe(nextStream);
        }

        return nextStream;
      }
    }
  }

  // If creating a stream
  if (isStreamDefinition(definition) || typeof definition === "string") {
    const factoryDefinition = (() => {
      if (typeof definition === "string") {
        return { type: definition };
      }

      return definition;
    })();

    // Create a basic stream
    const stream = factory(factoryDefinition);

    // If we have a readFrom source
    if (readFrom != null) {
      if (!isWritable(stream)) {
        throw new Error(
          "Defined a stream that is not writable to receive options.readFrom"
        );
      }
      readFrom.pipe(stream);
    }

    // Return the stream
    return stream;
  }

  // If supplied a stream
  if (isSupportedStream(definition)) {
    if (readFrom != null) {
      if (!isWritable(definition)) {
        throw new Error(
          "Supplied a stream that is not writable to receive options.readFrom"
        );
      }
      readFrom.pipe(definition);
    }
    return definition;
  }

  // TODO: Use a supplied function to create the stream (lazy)

  throw new Error("Missing either a stream, combine or type definition");
};

export default compose;
