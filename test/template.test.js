import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ejs from "ejs";

const template = readFileSync(
  fileURLToPath(new URL("../views/home.ejs", import.meta.url)),
  "utf8",
);

const sampleUrl = {
  shortId: "AbC12345",
  redirectUrl: "https://example.com",
  visitedHistory: [{ timestamp: new Date() }],
  createdBy: { name: "Jane Admin", email: "jane@example.com" },
};

test("admin view (showOwner) renders the Created By column with name and email", () => {
  const html = ejs.render(template, {
    showOwner: true,
    urls: [sampleUrl],
    user: { name: "Jane Admin" },
  });
  assert.ok(html.includes("Created By"));
  assert.ok(html.includes("Jane Admin"));
  assert.ok(html.includes("jane@example.com"));
});

test("normal home view hides the Created By column", () => {
  const html = ejs.render(template, {
    urls: [{ ...sampleUrl, createdBy: undefined }],
    user: { name: "Normal User" },
  });
  assert.ok(!html.includes("Created By"));
});

test("admin view falls back to Unknown when owner is missing/deleted", () => {
  const html = ejs.render(template, {
    showOwner: true,
    urls: [{ ...sampleUrl, createdBy: null }],
    user: { name: "Jane Admin" },
  });
  assert.ok(html.includes("Unknown"));
});

test("logged-out view shows the auth-required message", () => {
  const html = ejs.render(template, { auth: false });
  assert.ok(html.includes("Authentication Required"));
});

test("logged-in view shows the user's URL rows", () => {
  const html = ejs.render(template, {
    urls: [sampleUrl],
    user: { name: "Normal User" },
  });
  assert.ok(html.includes("AbC12345"));
  assert.ok(html.includes("https://example.com"));
  assert.ok(html.includes("Logout"));
});
