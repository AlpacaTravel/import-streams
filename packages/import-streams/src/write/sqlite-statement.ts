import Database, { Statement, Database as DatabaseType } from "better-sqlite3";
import { Writable } from "readable-stream";

interface SqliteStatementOptions {
  database: string;
  sql: string;
  debug?: boolean;
}

type Callback = (error?: Error) => undefined;

class SqliteStatement extends Writable {
  private path: string;
  private sql: string;
  private statement?: any;
  private database?: DatabaseType;
  private useDebug: boolean;

  constructor(options: SqliteStatementOptions) {
    super({ objectMode: true });

    this.path = options.database;
    this.sql = options.sql;
    this.useDebug = options.debug || false;
  }

  debug(...args: any[]) {
    if (this.useDebug === true) {
      console.log("sqlite-statement:", ...args);
    }
  }

  getDatabase(): DatabaseType {
    if (this.database) {
      return this.database;
    }

    this.database = new Database(this.path);

    return this.database;
  }

  getStatement(): Statement {
    if (this.statement) {
      return this.statement;
    }

    this.statement = this.getDatabase().prepare(this.sql);

    return this.statement;
  }

  _write(obj: any, _: string, callback: Callback) {
    try {
      const statement = this.getStatement();
      if (Array.isArray(obj)) {
        this.debug("Pushing array", this.sql, obj);
        statement.run(...obj);
      } else {
        this.debug("Pushing object", this.sql, obj);
        statement.run(obj);
      }
      callback();
    } catch (e) {
      this.debug("Got error", e.message);
      callback(e);
    }
  }

  _final() {
    const db = this.getDatabase();
    if (db) {
      this.debug("Closing the database");
      db.close();
    }
  }
}

export const createWriteStream = (options: SqliteStatementOptions) => {
  return new SqliteStatement(options);
};

export default SqliteStatement;
