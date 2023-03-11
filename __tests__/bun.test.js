/* global test, expect, beforeAll, afterAll, Bun */

let server;
beforeAll(() => {
   server = Bun.serve({
    port: 3002,
    fetch(req) {
      return new Response(`Bun!`);
    },
  });
});

afterAll(() => {
  server.stop();
});

test('runs in bun', async () => {
  const res = await Bun.fetch('http://localhost:3002');
  const body = await res.text();
  expect(body).toBe('Bun!');
})
