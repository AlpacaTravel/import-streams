declare module "multi-write-stream" {
  import { Writable, WritableOptions } from "readable-stream";
  class MultiWriteStream extends Writable {
    constructor(streams: Writable[], options?: WritableOptions);
    static obj(
      streams: Writable[],
      options?: WritableOptions
    ): MultiWriteStream;
  }

  export default MultiWriteStream;
}
