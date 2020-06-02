import Database, { Statement, Database as DatabaseType } from "better-sqlite3";
import { Writable } from "readable-stream";

interface SqliteStatementWriteOptions {
  database: string;
  sql: string;
}

type Callback = (error?: Error) => undefined;

class SqliteWrite extends Writable {
  private path: string;
  private sql: string;
  private statement?: any;
  private database?: DatabaseType;

  constructor(options: SqliteStatementWriteOptions) {
    super({ objectMode: true });

    this.path = options.database;
    this.sql = options.sql;
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
        statement.run(...obj);
      } else {
        statement.run(obj);
      }
      callback();
    } catch (e) {
      callback(e);
    }
  }

  _final() {
    const db = this.getDatabase();
    if (db) {
      db.close();
    }
  }
}

export const createWriteStream = (options: SqliteStatementWriteOptions) => {
  return new SqliteWrite(options);
};

export default SqliteWrite;
