import { Readable } from "readable-stream";

interface ReadObjectOptions {
  value: any;
  iterate?: boolean;
}

export default class ReadObject extends Readable {
  private generator?: any;
  private count: number;
  private limit: number;
  private value: any;
  private iterate: boolean;

  constructor(options: ReadObjectOptions) {
    super({ objectMode: true });
    this.count = 0;
    this.limit = 0;

    const { value, iterate = true } = options || {};

    this.value = value;
    this.iterate = iterate;
  }

  async *getRecordsGenerator() {
    if (Array.isArray(this.value) && this.iterate === true) {
      for (let val of this.value) {
        yield val;
      }
    } else {
      yield this.value;
    }
  }

  _read() {
    const generator = (() => {
      if (!this.generator) {
        this.generator = this.getRecordsGenerator();
      }

      return this.generator;
    })();

    (async () => {
      try {
        const {
          value,
          done,
        }: { value: any; done: boolean } = await generator.next();
        if (value) {
          this.push(value);
          this.count += 1;
        }
        if (done || (this.limit && this.count >= this.limit)) {
          this.push(null);
        }
      } catch (e) {
        console.error(e);
        this.destroy(e);
      }
    })();
  }
}

export const createReadStream = (options: ReadObjectOptions) => {
  return new ReadObject(options);
};
