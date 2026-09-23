import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

// Env is only read when setToken/getUser are called, so assigning it here
// (after static imports are evaluated) is safe.
process.env.JWT_SECRET_KEY = "test-secret";

const { setToken, getUser } = await import("../utils/auth.js");

const fakeUser = {
  _id: "64b000000000000000000001",
  email: "john@example.com",
  name: "John Doe",
  role: "NORMAL",
};

test("setToken signs a JWT containing user fields and role", () => {
  const token = setToken(fakeUser);
  assert.ok(typeof token === "string" && token.length > 0);

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  assert.equal(decoded._id, fakeUser._id);
  assert.equal(decoded.email, fakeUser.email);
  assert.equal(decoded.name, fakeUser.name);
  assert.equal(decoded.role, "NORMAL");
  // 30-day expiry set (allow small clock drift)
  const ttl = decoded.exp - decoded.iat;
  assert.ok(ttl <= 30 * 24 * 60 * 60 && ttl > 29 * 24 * 60 * 60);
});

test("setToken includes the ADMIN role when present", () => {
  const token = setToken({ ...fakeUser, role: "ADMIN" });
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  assert.equal(decoded.role, "ADMIN");
});

test("setToken returns null when signing fails (missing secret)", () => {
  const original = process.env.JWT_SECRET_KEY;
  delete process.env.JWT_SECRET_KEY;
  try {
    assert.equal(setToken(fakeUser), null);
  } finally {
    process.env.JWT_SECRET_KEY = original;
  }
});

test("getUser round-trips a valid token", () => {
  const token = setToken(fakeUser);
  const user = getUser(token);
  assert.equal(user.email, fakeUser.email);
  assert.equal(user.role, "NORMAL");
});

test("getUser returns false for a tampered token", () => {
  const token = setToken(fakeUser);
  const tampered = token.slice(0, -2) + "xx";
  assert.equal(getUser(tampered), false);
});

test("getUser returns false for a token signed with another secret", () => {
  const foreign = jwt.sign(
    { _id: fakeUser._id, email: fakeUser.email, name: fakeUser.name, role: "ADMIN" },
    "other-secret",
  );
  assert.equal(getUser(foreign), false);
});

test("getUser returns false for an expired token", () => {
  const expired = jwt.sign(
    { _id: fakeUser._id, email: fakeUser.email, name: fakeUser.name, role: "NORMAL" },
    process.env.JWT_SECRET_KEY,
    { expiresIn: -10 },
  );
  assert.equal(getUser(expired), false);
});
