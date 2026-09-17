const assert = require("node:assert/strict");

const { forgotPassword, resetPassword } = require("../controllers/auth/forgotPassword.controller");

(async () => {
  const responses = [];

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      responses.push({ statusCode: this.statusCode, payload });
      return this;
    },
    cookie() {},
    clearCookie() {},
  };

  await forgotPassword({ body: {} }, res);
  assert.equal(responses[0].statusCode, 400);
  assert.equal(responses[0].payload.success, false);

  await resetPassword({ body: { email: "test@example.com", otp: "123456", newPassword: "abc" } }, res);
  assert.equal(responses[1].statusCode, 400);
  assert.equal(responses[1].payload.success, false);

  console.log("forgot password validation tests passed");
})();
