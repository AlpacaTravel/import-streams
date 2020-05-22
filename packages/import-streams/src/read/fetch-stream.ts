import assert from "assert";
import network from "../network";
import { Readable } from "readable-stream";

const createReadStream = async (
  url: string,
  options: any
): Promise<Readable | ReadableStream<Uint8Array> | null> => {
  return network.streamRead(url, options);
};

export default createReadStream;
