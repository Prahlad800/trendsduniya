import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("production app starts without CommonJS require(ESM) support", () => {
  // Vercel's loader rejects sanitize-html's require() of ESM-only htmlparser2.
  // A normal local Node 24 import would hide this deployment regression.
  const result = spawnSync(process.execPath, [
    "--no-experimental-require-module",
    "--input-type=module",
    "-e",
    `
      import assert from "node:assert/strict";
      import app from "./src/app.js";
      import { cleanHtml, plainText } from "./src/utils/sanitize.js";

      const safe = cleanHtml('<p>Hello <strong>world</strong></p><script>alert(1)</script><img src="https://example.test/a.png" onerror="alert(1)"><a href="javascript:alert(1)">link</a>');
      assert.ok(safe.includes('<p>Hello <strong>world</strong></p>'));
      assert.ok(safe.includes('src="https://example.test/a.png"'));
      assert.doesNotMatch(safe, /script|onerror|javascript:/i);
      assert.equal(plainText('<p>Hello &amp; goodbye</p>'), 'Hello &amp; goodbye');

      const server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      try {
        for (const path of ['/', '/api/health']) {
          const response = await fetch('http://127.0.0.1:' + server.address().port + path);
          assert.equal(response.status, 200);
          assert.equal((await response.json()).success, true);
        }
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    `,
  ], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, VERCEL: "1", NODE_ENV: "production", MONGODB_URI: "mongodb://127.0.0.1:1/deployment_test" },
    encoding: "utf8",
    timeout: 60000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
