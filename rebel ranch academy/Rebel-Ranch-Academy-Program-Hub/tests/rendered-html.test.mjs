import assert from "node:assert/strict";
import test from "node:test";

test("renders the Rebel Ranch Academy home page", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /Rebel Ranch Academy/i);
  assert.match(html, /Build the skills/i);
});

test("renders the learner Library with the RRM parent link and free activities", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `lib-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/learn/library", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Library \| Rebel Ranch Academy/);
  assert.match(html, /Free activities/);
  assert.match(html, /Stay Useful in Hard Times/);
  assert.match(html, /Rebel Ranch Ministries/);
  assert.match(html, /Faith, Family &amp; Nature Church/);
  assert.match(html, /data-image-slot="activity-water-ready"/);
});
