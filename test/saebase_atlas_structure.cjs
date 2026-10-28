"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");

const website = path.resolve(__dirname, "..");
const root = path.join(website, "opensae", "saebase", "atlas");
const own = path.join(website, "opensae", "openresearch", "atlas");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const manifest = JSON.parse(read("site-manifest.json"));

assert.equal(manifest.schema, "saebase.atlas.deployment.v1");
assert.equal(manifest.project, "SAEBase");
assert.match(manifest.source_sha, /^[0-9a-f]{40}$/);
assert(manifest.chunks.length >= 2, "Code and Context data must be source-backed");
const window = {};
for (const chunk of manifest.chunks) {
  const body = read(chunk);
  const checksum = crypto.createHash("sha256").update(body).digest("hex");
  assert.equal(checksum, manifest.chunk_sha256[chunk], "Corrupt data chunk " + chunk);
  vm.runInNewContext(body, {window}, {filename: chunk});
}
vm.runInNewContext(read("data-bootstrap.js"), {window});
const graphs = window.OPENRESEARCH_ATLAS;
assert(graphs && String(graphs.context.project).startsWith("SAEBase"));
for (const name of ["core", "knowledge", "code", "environment", "context"]) {
  assert.equal(manifest.tree_counts[name], graphs[name].nodes.length);
  assert(graphs[name].nodes.length > 0, "Missing " + name + " tree");
  const html = read(name + ".html");
  assert(html.includes("<title>SAEBase Atlas"), "Wrong project branding " + name);
  assert(html.includes("data-bootstrap.js"), "Missing source-data loader");
  assert(html.includes("locale-runtime.js"), "Missing bilingual node renderer");
  assert(html.includes("locale-data.js"), "Missing English locale data");
  assert(html.includes('href="' + name + '.html"'), "No standalone " + name + " route");
  assert(!html.includes("opensae/openresearch/atlas"), "Foreign URL in " + name);
}
assert(graphs.code.nodes.length >= 2000, "Missing most Python source entities");
assert(graphs.knowledge.nodes.some(n => n.id === "s.sae.capture"));
assert(!graphs.knowledge.nodes.some(n => /cub/i.test(n.id)));

vm.runInNewContext(read("locale-data.js"), {window});
const en = window.SAEBASE_ATLAS_LOCALES;
assert.equal(en.project, "SAEBase");
assert.equal(en.schema, "saebase.atlas.locale.v2");
for (const [tree, data] of Object.entries(graphs)) {
  const ids = new Set(data.nodes.map(n => n.id));
  const translations = en.nodes[tree];
  assert.equal(ids.size, Object.keys(translations).length);
  for (const id of ids) {
    const fields = translations[id];
    assert(fields, "Untranslated " + tree + " node " + id);
    for (const field of ["title", "summary", "description"]) {
      assert(typeof fields[field] === "string" && fields[field].length > 0);
      assert(!/[\u3400-\u9fff\ufffd]/.test(fields[field]), "Invalid English " + tree + "/" + id);
    }
  }
}
assert(en.nodes.context["term.sae"].why_it_matters);
assert(en.nodes.context["term.saebase_runtime"].why_it_matters);
assert(!fs.existsSync(path.join(root, "demo-knowledge-plan.json")),
  "Standalone SAEBase Atlas must not include OpenResearch demo plans");
assert(fs.existsSync(path.join(own, "data.js")), "OpenResearch must retain its own data");
assert(!fs.existsSync(path.join(own, "locale-data.js")),
  "Do not inject SAEBase locale data into the OpenResearch project");
console.log("Independent SAEBase and OpenResearch sites verified:", manifest.tree_counts);
