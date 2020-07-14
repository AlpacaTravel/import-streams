import set from "../../../src/transform/set";
import { createCompose } from "../../../src/index";

const compose = createCompose();

describe("set", () => {
  test("will set a value on an object", async () => {
    const options = {
      path: "foo",
      value: "bar",
      context: {
        compose,
      },
    };
    const value = { name: "Cam" };
    const result = await set(value, options);
    expect(result).toMatchObject({
      name: "Cam",
      foo: "bar",
    });
    expect(result === value).toBe(false);
  });
});
