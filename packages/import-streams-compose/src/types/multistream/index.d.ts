declare module "multistream" {
  import { Stream, Readable } from "readable-stream";

  type LazyStream = () => Stream;
  type FactoryStream = (cb: FactoryStreamCallback) => void;

  interface FactoryStreamCallback {
    (err: Error | null, stream: null): any;
    (err: null, stream: Readable): any;
  }

  type Streams = Array<LazyStream | Readable> | FactoryStream;

  class MultiStream extends Readable {
    constructor(streams: Streams);
    static obj(streams: Streams): MultiStream;
  }
  // export function obj(streams: Streams): MultiStream;

  export default MultiStream;
}
