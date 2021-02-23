import bufferToString from "../../../src/transform/buffer-to-string";
import { createCompose } from "../../../src/index";

const compose = createCompose();

describe("buffer-to-string", () => {
  test("will convert a buffer to a string", async () => {
    const options = {
      context: {
        compose,
      },
    };
    const val = JSON.stringify({ name: "Cam" });
    const value = new Buffer(val);
    expect(await bufferToString(value, options)).toBe(val);
  });
});
