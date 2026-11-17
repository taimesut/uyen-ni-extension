#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = "extension/manifest.json";
const OUTPUT = "userscript/spx-operations-tools-safari.user.js";
const META = "userscript/spx-operations-tools-safari.meta.js";
const PARTS = [
  ["SPX same-origin API bridge", "extension/bridge.js"],
  ["SPX status data", "extension/status-data.js"],
  ["SPX responsive UI", "extension/ui.js"],
  ["SPX native sidebar menu", "extension/menu.js"]
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
}

function versionParts(value) {
  if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(value)) {
    throw new Error("Invalid extension/manifest.json version: " + value);
  }
  return value.split(".").map(Number);
}

function compareVersions(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let i = 0; i < 4; i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function metadataValue(source, name) {
  const prefix = "// @" + name;
  const match = source.split("\n").find(line => line.startsWith(prefix + " "));
  return match ? match.slice(prefix.length).trim() : "";
}

function build() {
  const manifest = JSON.parse(read(MANIFEST));
  const version = String(manifest.version || "");
  versionParts(version);
  const userVersion = versionParts(version).length === 3 ? version + ".0" : version;

  let bootstrap = read("userscript/safari-bootstrap.js");
  const metaPattern = /^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m;
  if (!metaPattern.test(bootstrap)) {
    throw new Error("Userscript metadata header missing");
  }
  if (!/^\/\/ @version\s+\S+/m.test(bootstrap)) {
    throw new Error("@version missing in userscript bootstrap");
  }

  bootstrap = bootstrap.replace(/^\/\/ @version\s+\S+/m, "// @version      " + userVersion);
  const match = bootstrap.match(metaPattern);
  if (match.index !== 0) throw new Error("Userscript metadata must be at the beginning");
  const meta = match[0] + "\n";

  const baseURL = "https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/";
  if (metadataValue(meta, "downloadURL") !== baseURL + path.basename(OUTPUT) ||
      metadataValue(meta, "updateURL") !== baseURL + path.basename(META)) {
    throw new Error("Userscript @downloadURL/@updateURL are not pointing to GitHub main");
  }

  // The extension uses MAIN/ISOLATED worlds. In a userscript, provide a
  // lexical chrome shim to the bundled modules without overwriting native chrome.
  const chunks = [
    bootstrap.trimEnd(),
    "(() => {\n  \"use strict\";\n  const chrome = globalThis.__SPX_USERSCRIPT_CHROME__;\n  if (!chrome) throw new Error(\"Uyen Ni GM bootstrap missing\");"
  ];
  for (const [label, file] of PARTS) {
    chunks.push("// ---- " + label + " ----", read(file).trimEnd());
  }
  chunks.push("})();");

  const output = chunks.join("\n\n") + "\n";
  new vm.Script(output, {filename: OUTPUT});
  return {output, meta, version: userVersion};
}

function current(file) {
  return fs.existsSync(path.join(ROOT, file)) ? read(file) : null;
}

function write(file, content) {
  if (current(file) === content) return false;
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, content, "utf8");
  console.log("Wrote " + file + " (" + Buffer.byteLength(content) + " bytes)");
  return true;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && !["--check", "--release"].includes(args[0]))) {
    throw new Error("Usage: node scripts/build-userscript.cjs [--check | --release]");
  }

  const mode = args[0] || "";
  let built = build();
  const existing = current(OUTPUT);

  if (mode === "--release" && existing && existing !== built.output) {
    const previous = metadataValue(existing, "version");
    if (previous && compareVersions(built.version, previous) <= 0) {
      const manifest = JSON.parse(read(MANIFEST));
      const parts = versionParts(manifest.version);
      parts[2] += 1;
      manifest.version = parts.join(".");
      fs.writeFileSync(path.join(ROOT, MANIFEST), JSON.stringify(manifest, null, 2) + "\n");
      console.log("Auto-bumped version to " + manifest.version);
      built = build();
    }
  }

  if (mode === "--check") {
    if (current(OUTPUT) !== built.output || current(META) !== built.meta) {
      throw new Error("Generated files out of date; run node scripts/build-userscript.cjs");
    }
    console.log("Verified Userscript and metadata: " + built.version);
    return;
  }

  const changedUser = write(OUTPUT, built.output);
  const changedMeta = write(META, built.meta);
  if (!changedUser && !changedMeta) console.log("Already up to date: " + built.version);
}

try {
  main();
} catch (error) {
  console.error("Userscript build failed:", error.message);
  process.exitCode = 1;
}
