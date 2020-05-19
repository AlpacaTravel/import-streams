import { Writable, Readable, Transform } from "readable-stream";
import MultiStream from "multistream";
import assert from "assert";

export interface StreamFactoryOptions {}

export type SupportedStream = Readable | Transform | Writable;

export interface ComposableStreamDefinition {
  stream?: ComposableDefinition | ComposableDefinition[];
  combine?: ComposableDefinition[];
}

export interface StreamDefinition {
  type: string;
  options?: StreamFactoryOptions;
}

export type ComposableDefinition =
  | StreamDefinition
  | ComposableStreamDefinition;

export type StreamFactory = (
  streamDefinition: StreamDefinition
) => SupportedStream;

const asReadablePipeTypes = (stream: SupportedStream): Readable => {
  if (stream instanceof Readable || stream instanceof Transform) {
    return stream;
  }
  throw new Error("Should not stream from a writable stream");
};

const asWritablePipeType = (stream: SupportedStream): Transform | Writable => {
  if (stream instanceof Writable || stream instanceof Transform) {
    return stream;
  }
  throw new Error("Should not stream to a readable stream");
};

const isStreamDefinition = (
  tbd: ComposableDefinition
): tbd is StreamDefinition => {
  if ("type" in tbd) {
    return true;
  }
  return false;
};

const isComposableStreamDefinition = (
  tbd: ComposableDefinition
): tbd is ComposableStreamDefinition => {
  if ("stream" in tbd || "combine" in tbd) {
    return true;
  }
  return false;
};

export interface ComposeOption {
  factory: StreamFactory;
}

const compose = (
  definition: ComposableDefinition,
  options: ComposeOption
): SupportedStream => {
  assert(
    typeof options.factory === "function",
    "Missing required factory method for creating factory"
  );

  // Options
  if (isComposableStreamDefinition(definition)) {
    const { stream, combine } = definition;
    if (stream) {
      // Create a piped set of stream
      assert(!combine, "Should not use combine in combination with stream");

      const streams = Array.isArray(stream) ? stream : [stream];
      const result = streams.reduce((prior: null | SupportedStream, subdef) => {
        const nextStream = compose(subdef, options);
        if (prior == null) {
          return nextStream;
        }

        return prior.pipe(asWritablePipeType(nextStream));
      }, null);

      if (result) {
        return result;
      }
    }

    if (combine) {
      // Create a combined stream
      assert(!stream, "Should not use stream in combination with combine");

      const combines = Array.isArray(combine) ? combine : [combine];
      const combinableStreams: Readable[] = combines.map(
        (subdef: ComposableDefinition) => {
          return asReadablePipeTypes(compose(subdef, options));
        }
      );

      return MultiStream.obj(combinableStreams);
    }
  }
  if (isStreamDefinition(definition)) {
    // Create a basic stream
    return options.factory(definition);
  }

  throw new Error("Missing either a stream, combine or type");
};

export default compose;
