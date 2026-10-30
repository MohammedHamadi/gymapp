const { spawnSync } = require("node:child_process");
const path = require("node:path");
const result = spawnSync(require("electron"), [
  "--experimental-vm-modules", "--test", path.join(__dirname, "../tests/subscriptions.test.cjs"),
], {
  cwd: path.join(__dirname, ".."),
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  stdio: "inherit", windowsHide: true,
});
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
