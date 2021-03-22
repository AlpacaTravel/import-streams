import resolveSqliteStatementObject, {
  ResolveSqliteStatementObjectOptions,
} from "../../../src/transform/resolve-sqlite-statement-object";
import { createCompose } from "../../../src/index";

const compose = createCompose();
const context = {
  compose,
};

describe("Ressolve Sqlite Statement Object", () => {
  test("resolves test data", async () => {
    const options: ResolveSqliteStatementObjectOptions = {
      context,
      mapping: {
        fubar: "id",
      },
      database: "./tests/data/test.db",
      sql: "SELECT * FROM test WHERE id IS NOT @id",
    };
    const result = await resolveSqliteStatementObject({ id: 1 }, options);

    expect(result).toMatchObject([
      { fubar: 2 },
      { fubar: 3 },
      { fubar: 4 },
      { fubar: 5 },
    ]);
  });
  test("passes through value", async () => {
    const options: ResolveSqliteStatementObjectOptions = {
      context,
      mapping: {
        fubar: "id",
      },
      database: "./tests/data/test.db",
      sql: "SELECT * FROM test WHERE id IS NOT @id",
      passThroughValue: true,
    };
    const result = await resolveSqliteStatementObject({ id: 1 }, options);

    expect(result).toMatchObject({ id: 1 });
  });
});
