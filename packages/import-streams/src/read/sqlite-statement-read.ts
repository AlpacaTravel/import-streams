import { Readable } from "readable-stream";
import Database from "better-sqlite3";

export interface SqliteStatementReadOptions {
  database: string;
  sql: string;
  debug?: boolean;
}

class SqliteStatementRead<T> extends Readable {
  private path: string;
  private sql: string;
  private generator: any;
  private useDebug: any;

  constructor(options: SqliteStatementReadOptions) {
    super({ objectMode: true });

    this.path = options.database;
    this.sql = options.sql;
    this.useDebug = options.debug || false;
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("sqlite-query:", ...args);
    }
  }

  async *getRecordsGenerator() {
    const db = new Database(this.path, { readonly: true });

    try {
      this.debug(this.sql);
      const select = db.prepare(this.sql);
      const all = select.all();
      for (let row of all) {
        yield row;
      }
    } catch (e) {
      this.debug(e.message);
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
          this.debug("Pushing", value);
          this.push(value);
        }
        if (done) {
          this.debug("done");
          this.push(null);
        }
      } catch (e) {
        this.debug(e.message);
        this.destroy(e);
      }
    })();
  }
}

export default SqliteStatementRead;

export function createReadStream<T>(options: SqliteStatementReadOptions) {
  return new SqliteStatementRead<T>(options);
}