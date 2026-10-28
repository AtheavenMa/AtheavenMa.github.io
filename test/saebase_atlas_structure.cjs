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
const allChunks = fs.readdirSync(root).filter(name => /^data-\d{3}\.js$/.test(name));
assert.deepEqual(allChunks.sort(), manifest.chunks.slice().sort(),
  "A new source snapshot must remove obsolete data shards");
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
// Public Code cards represent independently justified research capabilities.
// Every other raw AST entity remains available in the expandable source inventory.
const publicCode = graphs.code;
const visibleIds = new Set(publicCode.nodes.map(node => node.id));
const sourceOwner = publicCode.source_api_index || {};
assert(publicCode.nodes.length >= 200, "Missing semantic Code capabilities");
assert(Number.isInteger(publicCode.source_api_total) &&
  publicCode.source_api_total > publicCode.nodes.length,
  "Missing original Python AST source inventory");
assert.equal(publicCode.source_api_total,
  publicCode.nodes.length + Object.keys(sourceOwner).length,
  "Loss of original Python source symbols during semantic projection");
const embedded = new Map();
for(const node of publicCode.nodes) {
  for(const block of node.attributes || []) {
    if(block.type !== "source_interfaces")continue;
    for(const member of block.members || []) {
      assert(!embedded.has(member.id), "Duplicated original AST interface " + member.id);
      assert(member.path || member.source_symbol,
        "Missing source identity for folded interface " + member.id);
      embedded.set(member.id, node.id);
    }
  }
}
assert.equal(embedded.size, Object.keys(sourceOwner).length,
  "Some folded source interfaces are not readable in Atlas details");
for(const [source, owner] of Object.entries(sourceOwner)) {
  assert(visibleIds.has(owner), "Folded source points to unknown owner " + source);
  assert.equal(embedded.get(source), owner, "Folded interface ownership drifted: " + source);
}
const children = new Map();
for(const edge of publicCode.edges || []) {
  if(edge.type !== "contains")continue;
  const entries = children.get(edge.source) || [];
  entries.push(edge.target);
  children.set(edge.source,entries);
}
const byId = new Map(publicCode.nodes.map(node => [node.id,node]));
const normalizeMeaning = value => String(value || "").replace(/[\W_]+/gu,"").toLowerCase();
for(const [parent, ids] of children) {
  for(const field of ["title","summary"]) {
    const seen = new Set();
    for(const id of ids) {
      const value = normalizeMeaning(byId.get(id)?.[field]);
      if(!value)continue;
      assert(!seen.has(value),
        "Repeated semantic sibling " + field + " below " + parent + ": " + value);
      seen.add(value);
    }
  }
}
assert(!publicCode.nodes.some(node =>
  /源码依据和调用参数可在节点的展开说明中查看/.test(node.summary || "")),
  "Old generated filler leaked into visible Code capabilities");
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
// Exercise the actual node projection in both directions without changing IDs,
// statuses, source paths, review decisions, or the authoritative Chinese graph.
const original = Object.fromEntries(Object.entries(graphs).map(([view, tree]) => [
  view, tree.nodes.map(node => ({
    id: node.id, title: node.title, status: node.status, path: node.path,
    line: node.line, evidence: JSON.stringify(node.evidence || []),
    context_ids: JSON.stringify(node.context_term_ids || [])
  }))
]));
window.dispatchEvent = () => {};
vm.runInNewContext(read("locale-runtime.js"), {window, Event: class Event {
  constructor(type) { this.type = type; }
}});
assert.equal(typeof window.SAEBASE_ATLAS_SET_NODE_LANGUAGE, "function");
window.SAEBASE_ATLAS_SET_NODE_LANGUAGE("en");
for(const [view, tree] of Object.entries(graphs)) {
  tree.nodes.forEach((node, index) => {
    const before = original[view][index];
    assert.equal(node.id, before.id);
    assert.equal(node.status, before.status);
    assert.equal(node.path, before.path);
    assert.equal(node.line, before.line);
    assert.equal(JSON.stringify(node.evidence || []), before.evidence);
    assert.equal(JSON.stringify(node.context_term_ids || []), before.context_ids);
    for(const key of ["title", "summary", "description"])
      assert(!/[\u3400-\u9fff\ufffd]/.test(node[key] || ""),
        "English view has untranslated or corrupted prose: " + view + "/" + node.id + "/" + key);
  });
}
window.SAEBASE_ATLAS_SET_NODE_LANGUAGE("zh");
for(const [view, tree] of Object.entries(graphs))
  tree.nodes.forEach((node,index) => {
    assert.equal(node.id, original[view][index].id);
    assert.equal(node.title, original[view][index].title,
      "Chinese title did not survive round-trip: " + view + "/" + node.id);
  });
assert(en.nodes.context["term.sae"].why_it_matters);
assert(en.nodes.context["term.saebase_runtime"].why_it_matters);
assert(!fs.existsSync(path.join(root, "demo-knowledge-plan.json")),
  "Standalone SAEBase Atlas must not include OpenResearch demo plans");
assert(fs.existsSync(path.join(own, "data.js")), "OpenResearch must retain its own data");
assert(!fs.existsSync(path.join(own, "locale-data.js")),
  "Do not inject SAEBase locale data into the OpenResearch project");
console.log("Independent SAEBase and OpenResearch sites verified:", manifest.tree_counts);
