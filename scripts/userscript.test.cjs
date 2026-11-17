"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const script = read("userscript/spx-operations-tools-safari.user.js");
const meta = read("userscript/spx-operations-tools-safari.meta.js");
const bootstrap = read("userscript/safari-bootstrap.js");
const manifest = JSON.parse(read("extension/manifest.json"));
const END = "// ==/UserScript==";

test("metadata matches full script and manifest version", () => {
  const version = manifest.version.split(".").length === 3
    ? manifest.version + ".0" : manifest.version;
  assert.ok(script.startsWith("// ==UserScript=="));
  assert.equal(meta, script.slice(0, script.indexOf(END) + END.length) + "\n");
  assert.ok(meta.split("\n").includes("// @version      " + version));
  assert.match(meta, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/taimesut\/uyen-ni-extension\/main\/userscript\/spx-operations-tools-safari\.meta\.js/);
  assert.match(meta, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/taimesut\/uyen-ni-extension\/main\/userscript\/spx-operations-tools-safari\.user\.js/);
  assert.match(script, /const chrome = globalThis\.__SPX_USERSCRIPT_CHROME__/);
  assert.match(script, /SPX_OPS_OPEN/);
});

function makeContext(extras = {}) {
  const map = new Map();
  const chrome = {native: true};
  const context = {
    chrome, URL, TextEncoder,
    window: {location: {href: "https://spx.shopee.vn/"}},
    localStorage: {
      getItem: key => map.get(key) ?? null,
      setItem: (key, value) => map.set(key, value),
      removeItem: key => map.delete(key)
    },
    ...extras
  };
  vm.runInNewContext(bootstrap, context, {timeout: 1000});
  assert.equal(context.chrome, chrome, "must not overwrite native chrome");
  assert.ok(context.__SPX_USERSCRIPT_CHROME__?.storage?.local);
  return context.__SPX_USERSCRIPT_CHROME__;
}

async function verifyStorage(compat) {
  await new Promise(resolve => compat.storage.local.set({foo: 42}, resolve));
  assert.equal((await new Promise(resolve => compat.storage.local.get("foo", resolve))).foo, 42);
  await new Promise(resolve => compat.storage.local.remove("foo", resolve));
  assert.equal((await new Promise(resolve => compat.storage.local.get("foo", resolve))).foo, undefined);
}

test("modern asynchronous GM storage is supported", async () => {
  const store = new Map();
  const compat = makeContext({GM: {
    getValue: key => Promise.resolve(store.get(key)),
    setValue: (key, value) => {store.set(key, value); return Promise.resolve();},
    deleteValue: key => {store.delete(key); return Promise.resolve();}
  }});
  await verifyStorage(compat);
});

test("legacy GM_* storage is supported", async () => {
  const store = new Map();
  const compat = makeContext({
    GM_getValue: key => store.get(key),
    GM_setValue: (key, value) => store.set(key, value),
    GM_deleteValue: key => store.delete(key)
  });
  await verifyStorage(compat);
});

test("localStorage fallback is supported", async () => {
  await verifyStorage(makeContext());
});

test("SeaTalk message delegates to manager XHR", async () => {
  let requests = 0;
  const compat = makeContext({
    GM_xmlhttpRequest: options => {
      requests += 1;
      assert.equal(options.method, "POST");
      options.onload({status: 200, responseText: '{"code":0}'});
    }
  });
  const response = await new Promise(resolve => {
    compat.runtime.sendMessage({
      type: "SEATALK_SEND_IMAGE",
      webhook: "https://openapi.seatalk.io/webhook/group/example",
      imageBase64: "aGVsbG8="
    }, resolve);
  });
  assert.equal(requests, 1);
  assert.equal(response.ok, true);
});
