import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const code = ts.transpileModule(readFileSync("app/api/send-confirmation-email/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const payload = { name: "Client Test", phone: "0600000000", email: "client@example.com", service: "Lavage extérieur", date: "2026-12-20", time: "Matin", message: "<script>test</script>", notificationEmail: "attacker@example.com" };

for (const scenario of ["success", "admin-fails", "client-fails", "missing-recipient"]) {
  test(scenario, async () => {
    const sent = [];
    const exports = {};
    vm.runInNewContext(code, {
      exports, require: createRequire(import.meta.url), URL, AbortSignal,
      process: { env: { BREVO_API_KEY: "fake-test-key", BREVO_SENDER_EMAIL: "sender@example.com", APPOINTMENT_TO_EMAIL: scenario === "missing-recipient" ? "" : "owner@example.com", SITE_URL: "https://example.com" } },
      console: { error() {} },
      fetch: async (url, options) => {
        assert.equal(url, "https://api.brevo.com/v3/smtp/email");
        const body = JSON.parse(options.body);
        sent.push(body);
        const isAdmin = body.to[0].email === "owner@example.com";
        if (scenario === "admin-fails" && isAdmin) throw new Error("Network failure");
        return { ok: !(scenario === "client-fails" && !isAdmin), status: 401 };
      },
    });
    const response = await exports.POST(new NextRequest("https://example.com/api/send-confirmation-email", { method: "POST", headers: { origin: "https://example.com", "content-type": "application/json" }, body: JSON.stringify(payload) }));
    assert.equal(response.status, scenario === "client-fails" ? 502 : 200);
    assert.equal(sent.length, scenario === "missing-recipient" ? 1 : 2);
    assert.equal(sent[0].to[0].email, "client@example.com");
    if (sent[1]) {
      assert.equal(sent[1].to[0].email, "owner@example.com");
      assert.equal(sent[1].replyTo.email, "client@example.com");
      assert.ok(sent[1].textContent.includes("https://example.com/admin"));
      assert.ok(!sent[1].htmlContent.includes("<script>"));
      assert.ok(sent[1].htmlContent.includes("&lt;script&gt;"));
    }
  });
}
