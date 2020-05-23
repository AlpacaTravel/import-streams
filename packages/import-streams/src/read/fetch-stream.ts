import { Readable, Transform } from "readable-stream";
import network from "../network";
import { Callback } from "../types";

const createReadStream = (url: string, options: any): Readable => {
  const t = new Transform({
    transform(chunk: any, encoding, cb: Callback) {
      this.push(chunk);
      cb();
    },
  });

  const httpOptions = Object.assign({ method: "get" }, options);
  network.streamRead(url, httpOptions).then((stream) => {
    stream.pipe(t);
  });

  return t;
};

export default createReadStream;
