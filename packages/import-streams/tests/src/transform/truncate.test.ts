import truncate from "../../../src/transform/truncate";
import { createCompose } from "../../../src/index";

const compose = createCompose();

describe("truncate", () => {
  test("will obtain a value from a string", async () => {
    const options = {
      length: 5,
      context: {
        compose,
      },
    };
    const value = "A really long string";
    expect(await truncate(value, options)).toBe("A re…");
  });
});
