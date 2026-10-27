"use strict";
/* Verify the exact large static Atlas snapshot plus its published overlay.
 * This runs inside the PUBLIC Pages checkout. No private repository data or
 * token is required, and no generated research state is edited.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const atlas = path.resolve(__dirname, "../opensae/openresearch/atlas");
const context = { window: {} };
for (const filename of ["data.js", "atlas-structure.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(atlas, filename), "utf8"),
    context, {filename, timeout: 20000});
}
const graphs = context.window.OPENRESEARCH_ATLAS;
const patch = context.window.OPENRESEARCH_ATLAS_PATCH;
assert(graphs && patch, "Both public Atlas assets must load");
assert.equal(patch.schema, "openresearch.atlas.structure.v1");
const originalCode = new Set(graphs.code.nodes.map(n=>n.id));

if (patch.knowledge) graphs.knowledge = patch.knowledge;
for (const view of ["code", "context"]) {
  const graph = graphs[view], data = patch[view];
  assert(graph && data, "Missing "+view+" overlay");
  const ids = new Set(graph.nodes.map(n=>n.id));
  for (const node of data.nodes || []) {
    if (!ids.has(node.id)) { graph.nodes.push(node); ids.add(node.id); }
  }
  if (view === "code") {
    const byId = new Map(graph.nodes.map(node=>[node.id,node]));
    for (const [id, links] of Object.entries(data.science_links || {})) {
      if (byId.has(id)) byId.get(id).context_ids = links;
    }
  }
  const moved = new Map(Object.entries(data.parents || {})
    .filter(([child,parent])=>ids.has(child) && ids.has(parent)));
  const expected = Object.keys(data.parents || {}).length;
  const missing=Object.entries(data.parents || {}).filter(
    ([child,parent])=>!ids.has(child)||!ids.has(parent));
  console.log(view+": matched "+moved.size+"/"+expected+
    " source-backed overlay edges; missing "+missing.length);
  if(missing.length)console.log("Missing "+view+" edge examples:",
    JSON.stringify(missing.slice(0,8)));
  graph.edges = graph.edges.filter(e=>e.type!=="contains" || !moved.has(e.target));
  for (const [target,source] of moved) {
    graph.edges.push({source,target,type:"contains"});
  }
}
const expectedViews=["core","knowledge","code","environment","context"];
assert.deepEqual(Object.keys(graphs).sort(), expectedViews.sort());
for(const [name,graph] of Object.entries(graphs)){
  const ids = new Set(graph.nodes.map(n=>n.id));
  assert.equal(ids.size, graph.nodes.length, name+" contains duplicated node IDs");
  const relations = new Set(name==="core" || name==="knowledge"
    ? ["contains","refines","addresses","decomposes"] : ["contains"]);
  const fanout = new Map();
  const primaryParent = new Map();
  for(const edge of graph.edges){
    assert(ids.has(edge.source) && ids.has(edge.target),
      name+": broken edge "+JSON.stringify(edge));
    if(!relations.has(edge.type))continue;
    fanout.set(edge.source, (fanout.get(edge.source)||0)+1);
    assert(!primaryParent.has(edge.target),
      name+": multiple tree parents for "+edge.target);
    primaryParent.set(edge.target,edge.source);
  }
  const worst=[...fanout].sort((a,b)=>b[1]-a[1])[0];
  assert((worst?.[1]||0) <=10,
    name+" exceeded 10 direct children: "+JSON.stringify(worst));
  console.log(name+": "+ids.size+" nodes; max direct children "+(worst?.[1]||0));
}
const kIds = new Set(graphs.knowledge.nodes.map(n=>n.id));
assert(kIds.has("knowledge:area:cub")&&kIds.has("knowledge:area:sae"),
  "Knowledge needs both scientific domains");
for(const area of ["assets","capture","intervene","generate","circuits",
                    "explain","benchmark","train"]){
  assert(kIds.has("s.sae."+area),"Missing SAE topic "+area);
}
assert(graphs.context.nodes.some(n=>n.id==="term.sae.capture"));
assert(graphs.code.nodes.some(n=>n.id.startsWith("code:nav:")));
assert([...originalCode].every(id=>graphs.code.nodes.some(n=>n.id===id)),
  "The overlay must retain every original Code source node");
assert(graphs.code.nodes.some(n=>n.id==="code:module:saebase.api.features" &&
      (n.context_ids||[]).includes("g.sae.activation_capture")),
      "SAE Code to Knowledge link did not survive");
for(const view of ["core","knowledge","code","environment","context"]){
  const html=fs.readFileSync(path.join(atlas,view+".html"),"utf8");
  const data=html.indexOf('src="./data.js"');
  const overlay=html.indexOf('src="./atlas-structure.js');
  const app=html.indexOf('src="./app.js');
  assert(data>=0&&overlay>data&&app>overlay,
    view+" has incorrect or missing defer script order");
}
console.log("PASS: published static Atlas is multi-domain, connected and bounded");
