import { test } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET_KEY = "test-secret";

const { setToken } = await import("../utils/auth.js");
const { checkAuthentication, restrictUser } = await import(
  "../middlewares/handleAuth.js"
);

// --- tiny mocks -----------------------------------------------------------

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    redirectedTo: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
    redirect(location) {
      this.redirectedTo = location;
      return this;
    },
  };
  return res;
};

const cookieToken = (user) => ({ cookies: { token: setToken(user) } });

const normalUser = {
  _id: "64b000000000000000000002",
  email: "normal@example.com",
  name: "Normal User",
  role: "NORMAL",
};

const adminUser = { ...normalUser, email: "admin@example.com", role: "ADMIN" };

// --- checkAuthentication --------------------------------------------------

test("checkAuthentication leaves req.user undefined when no cookie", () => {
  const req = { cookies: {} };
  let called = false;
  checkAuthentication(req, makeRes(), () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.user, undefined);
});

test("checkAuthentication sets req.user from a valid cookie", () => {
  const req = cookieToken(normalUser);
  checkAuthentication(req, makeRes(), () => {});
  assert.equal(req.user.email, normalUser.email);
  assert.equal(req.user.role, "NORMAL");
});

test("checkAuthentication sets req.user to false for a garbage token", () => {
  const req = { cookies: { token: "not-a-jwt" } };
  checkAuthentication(req, makeRes(), () => {});
  assert.equal(req.user, false);
});

// --- restrictUser ---------------------------------------------------------

test("restrictUser redirects to /login when not authenticated", () => {
  const req = { user: undefined };
  const res = makeRes();
  let nextCalled = false;
  restrictUser(["NORMAL", "ADMIN"])(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.redirectedTo, "/login");
  assert.equal(nextCalled, false);
});

test("restrictUser responds 403 when role is not allowed", () => {
  const req = { user: normalUser };
  const res = makeRes();
  let nextCalled = false;
  restrictUser(["ADMIN"])(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body, "UnAuthorized");
  assert.equal(nextCalled, false);
});

test("restrictUser calls next() when role is allowed", () => {
  const res = makeRes();
  let nextCalled = false;
  restrictUser(["NORMAL", "ADMIN"])({ user: normalUser }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  nextCalled = false;
  restrictUser(["ADMIN"])({ user: adminUser }, makeRes(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});
