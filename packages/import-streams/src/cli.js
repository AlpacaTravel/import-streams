const fs = require("fs");
const path = require("path");
const assert = require("assert");
const compose = require("./index.cjs.js").default;

const [file] = process.argv.slice(2);
assert(file, "Missing the specified file");

(async () => {
  // Resolved...
  const resolved = path.resolve(file);
  console.log("Resolving yaml input:", resolved);

  try {
    // Include the source
    const source = fs.readFileSync(resolved, "utf-8");

    // Process
    await new Promise((success, fail) => {
      compose(source).on("finish", success).on("error", fail);
    });
  } catch (e) {
    console.error(e);
  }
})();
