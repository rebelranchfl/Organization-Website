import assert from "node:assert/strict";
import test from "node:test";

async function fetchPath(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${path}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

// 2026-09-28: the Academy moved to rebelranchministries.org; this site forwards to it.
test("forwards the old Academy home to the main-site Academy home", async () => {
  const r = await fetchPath("/");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://rebelranchministries.org/rebel-ranch-academy.html");
});

test("forwards the old Library to the main-site Library", async () => {
  for (const p of ["/learn", "/learn/library"]) {
    const r = await fetchPath(p);
    assert.equal(r.status, 301);
    assert.equal(r.headers.get("location"), "https://rebelranchministries.org/academy-library.html");
  }
});

// The Wealth Management preview is verified on the live address instead: its existing
// password prompt header contains a long dash that Node's fetch refuses but Cloudflare serves.
