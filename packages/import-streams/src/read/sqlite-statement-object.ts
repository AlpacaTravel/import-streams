import { Readable } from "readable-stream";
import Database from "better-sqlite3";

export interface SqliteStatementObjectOptions {
  database: string;
  sql: string;
  debug?: boolean;
  params?: any;
}

class SqliteStatementObject<T> extends Readable {
  private path: string;
  private sql: string;
  private generator: any;
  private useDebug: any;
  private params: any;

  constructor(options: SqliteStatementObjectOptions) {
    super({ objectMode: true });

    this.path = options.database;
    this.sql = options.sql;
    this.useDebug = options.debug || false;
    this.params = options.params || {};
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("sqlite-query:", ...args);
    }
  }

  async *getRecordsGenerator(params: any) {
    const db = new Database(this.path, { readonly: true });

    try {
      this.debug(this.sql);
      const select = db.prepare(this.sql);
      const all = select.all(params);
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
        this.generator = this.getRecordsGenerator(this.params);
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

export default SqliteStatementObject;

export function createReadStream<T>(options: SqliteStatementObjectOptions) {
  return new SqliteStatementObject<T>(options);
}
