#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = "userscript/spx-operations-tools-safari.user.js";
const PARTS = [
  ["SPX same-origin API bridge", "extension/bridge.js"],
  ["SPX status data", "extension/status-data.js"],
  ["SPX responsive UI", "extension/ui.js"],
  ["SPX native sidebar menu", "extension/menu.js"]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
    .replace(/\r\n/g, "\n");
}

function build() {
  const manifest = JSON.parse(read("extension/manifest.json"));
  const version = String(manifest.version || "");
  if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
    throw new Error("Invalid extension/manifest.json version: " + version);
  }
  const userVersion = version.split(".").length === 3 ? version + ".0" : version;
  let bootstrap = read("userscript/safari-bootstrap.js");
  if (!bootstrap.includes("// ==UserScript==") || !bootstrap.includes("// ==/UserScript==")) {
    throw new Error("Missing userscript metadata in safari-bootstrap.js");
  }
  if (!/^\/\/ @version\s+\S+/m.test(bootstrap)) {
    throw new Error("Missing @version in safari-bootstrap.js");
  }
  bootstrap = bootstrap.replace(/^\/\/ @version\s+\S+/m, "// @version      " + userVersion);

  const chunks = [bootstrap.trimEnd()];
  for (const [label, file] of PARTS) {
    chunks.push("// ---- " + label + " ----", read(file).trimEnd());
  }
  const output = chunks.join("\n\n") + "\n";
  new vm.Script(output, { filename: OUTPUT });
  return output;
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--check")) {
    console.error("Usage: node scripts/build-userscript.cjs [--check]");
    process.exitCode = 2;
    return;
  }
  const expected = build();
  const outputPath = path.join(ROOT, OUTPUT);
  const existing = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n")
    : null;

  if (args.includes("--check")) {
    if (existing !== expected) {
      console.error("Userscript is out of date. Run: node scripts/build-userscript.cjs");
      process.exitCode = 1;
    } else {
      console.log("Userscript is up to date: " + OUTPUT);
    }
    return;
  }
  if (existing === expected) {
    console.log("Already up to date: " + OUTPUT);
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, expected, "utf8");
  console.log("Built " + OUTPUT + " (" + Buffer.byteLength(expected) + " bytes)");
}

try {
  main();
} catch (error) {
  console.error("Userscript build failed:", error.message);
  process.exitCode = 1;
}
