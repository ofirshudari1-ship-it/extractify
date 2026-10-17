// Extracts tsvToJson from content.js and checks it. Run: node tests/json-export.test.js
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "content", "content.js"), "utf8");
const fn = src.match(/function tsvToJson[\s\S]*?\r?\n  }\r?\n/)[0];
const tsvToJson = new Function(fn + "; return tsvToJson;")();
const assert = require("assert");

assert.deepStrictEqual(
  JSON.parse(tsvToJson("Name\tScore\t\nAlice\t95\tx\nBob\t80\ty")),
  [
    { Name: "Alice", Score: "95", col_3: "x" },
    { Name: "Bob", Score: "80", col_3: "y" },
  ]
);
assert.deepStrictEqual(JSON.parse(tsvToJson("A\tA\n1\t2")), [{ A: "1", A_2: "2" }]);
assert.deepStrictEqual(JSON.parse(tsvToJson("only a line")), ["only a line"]);
console.log("json-export: OK");
