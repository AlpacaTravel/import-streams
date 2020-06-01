import { Readable } from "readable-stream";
import Database from "better-sqlite3";

export interface SqliteQueryOptions {
  database: string;
  query: string;
}

class SqliteQuery<T> extends Readable {
  private path: string;
  private query: string;
  private generator: any;

  constructor(options: SqliteQueryOptions) {
    super({ objectMode: true });

    this.path = options.database;
    this.query = options.query;
  }

  async *getRecordsGenerator() {
    const db = new Database(this.path);

    try {
      const select = db.prepare(this.query);
      const all = select.all();
      for (let row of all) {
        yield row;
      }
    } catch (e) {
      throw e;
    } finally {
      db.close();
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
        }: { value: T; done: boolean } = await generator.next();
        if (value) {
          this.push(value);
        }
        if (done) {
          this.push(null);
        }
      } catch (e) {
        this.destroy(e);
      }
    })();
  }
}

export default SqliteQuery;

export function createReadStream<T>(options: SqliteQueryOptions) {
  return new SqliteQuery<T>(options);
}
