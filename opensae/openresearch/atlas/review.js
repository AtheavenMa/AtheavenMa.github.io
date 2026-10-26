/* Workplan-only overlay: authentic Atlas trees are not replaced by proposals. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const VIEWS = ["all", "knowledge", "code", "environment", "context"];
  const STATUS = {not_implemented: "red", partial: "yellow",
                  implemented: "green", deleted: "deleted"};
  let plan = null, local = false, token = null, selected = null;
  let filter = "all", search = "", staged = [], pendingMarks = new Map(), stagedAuthorization = false;
  const el = (tag, cls, value) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = String(value);
    return n;
  };
  function clear(node) { node.replaceChildren(); }
  function signal(message, bad=false) {
    $("error").textContent = message || "";
    $("error").classList.toggle("is-error", !!bad);
  }
  function valid(obj) {
    return obj && obj.schema === "openresearch.agent_flow.v1" &&
      typeof obj.preview_sha256 === "string" &&
      Array.isArray(obj.items) && obj.items.every(x =>
        typeof x.key === "string" && ["knowledge","code","environment","context"].includes(x.view));
  }
  function badge(state) { return STATUS[state] || "yellow"; }
  function title(row) { return row.after?.title || row.before?.title || row.node_id; }
  function shortHash(text) { return String(text || "").slice(0, 12); }
  function revNote() { $("rev").textContent = plan ? "Revision " + plan.revision : ""; }
  function isReady(row) { return plan && plan.phase === "review" &&
    row?.state === "partial" &&
    (plan.observations || []).some(x => (x.node_keys || []).includes(row.key)); }


  function treeOverview() {
    const svgRoot = $("changeTree");
    if (!svgRoot) return;
    svgRoot.replaceChildren();
    const xmlns = "http://www.w3.org/2000/svg";
    const draw = (tag, attrs, value) => {
      const e=document.createElementNS(xmlns,tag);
      for (const [key,v] of Object.entries(attrs || {})) e.setAttribute(key,String(v));
      if (value !== undefined) e.textContent=String(value);
      svgRoot.appendChild(e);return e;
    };
    const rows = (plan?.items||[]).filter(x=>filter==="all"||x.view===filter);
    const views = [...new Set(rows.map(x=>x.view))];
    const W=630,H=views.reduce((total,v)=>total+Math.max(86,rows.filter(x=>x.view===v).length*68+10),0)+6;
    svgRoot.setAttribute("viewBox","0 0 "+W+" "+Math.max(88,H));
    svgRoot.setAttribute("width",String(W));svgRoot.setAttribute("height",String(Math.max(88,H)));
    const color={
      not_implemented:["#f8dedf","#b83d48"],
      partial:["#fff0c7","#aa7410"],
      implemented:["#dcf1e3","#2d8457"],
      deleted:["#e5e7e9","#68747c"]
    };
    let y=6;
    for(const view of views){
      const sub=rows.filter(x=>x.view===view);
      const first=y+Math.max(0,(sub.length-1)*68)/2;
      draw("rect",{x:14,y:first+6,width:120,height:48,rx:9,fill:"#e8edf0",stroke:"#b8c7d0"});
      draw("text",{x:74,y:first+33,"font-size":13,"font-weight":650,
                   fill:"#33434e","text-anchor":"middle"},view);
      for(let i=0;i<sub.length;i++){
        const row=sub[i],ry=y+i*68,[fill,stroke]=color[row.state]||color.partial;
        draw("path",{d:"M 134 "+(first+30)+" H 156 V "+(ry+30)+" H 188",
                     fill:"none",stroke:"#b4c1c9","stroke-width":1.5});
        const tile=draw("rect",{x:188,y:ry,width:410,height:59,rx:9,
              fill,stroke,"stroke-width":selected===row.key?2.8:1.3,
              tabindex:0,role:"button","aria-label":title(row)+": "+row.state});
        const textTitle=title(row).slice(0,55);
        draw("text",{x:201,y:ry+23,"font-size":12.4,"font-weight":650,fill:"#26363d"},textTitle);
        draw("text",{x:201,y:ry+44,"font-size":10.5,fill:stroke},(row.operation+" · "+row.state.replace(/_/g," ")+(row.parent_id ? " · under "+row.parent_id : "")).slice(0,75));
        tile.style.cursor="pointer";
        const open=()=>{selected=row.key;paint();};
        tile.addEventListener("click",open);
        tile.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();open();}});
      }
      y+=Math.max(86,sub.length*68+10);
    }
  }

  function renderQueue() {
    const queue = $("queue"); clear(queue);
    if (!plan) return;
    const rows = plan.items.filter(x => (filter === "all" || x.view === filter) &&
      [x.key, title(x), x.before?.description, x.after?.description]
      .join(" ").toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    $("counts").textContent = rows.length + "/" + plan.items.length;
    for (const item of rows) {
      const button = el("button", "queue-item " + badge(item.state) +
                        (selected === item.key ? " active" : ""));
      button.type = "button"; button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(selected === item.key));
      const top = el("div", "queue-name", title(item));
      const tag = el("small", "", item.view + " · " + item.operation);
      const state = el("i", "queue-state " + badge(item.state));
      top.prepend(state); button.append(top, tag);
      button.addEventListener("click", () => { selected = item.key; paint(); });
      queue.appendChild(button);
    }
  }
  function renderAudit() {
    const area = $("audit"); clear(area);
    if (!plan) return;
    const basics = el("section", "audit-block");
    basics.append(el("small", "", "PLAN FINGERPRINT"),
                  el("p", "mono", shortHash(plan.preview_sha256)));
    const scope = el("section", "audit-block");
    scope.append(el("small", "", "AUTHORIZED SCOPE"));
    const files = el("ul", "scope-list");
    for (const path of plan.allowed_paths || []) files.appendChild(el("li", "", path));
    scope.appendChild(files);
    const process = el("section", "audit-block");
    process.append(el("small", "", "DEPLOYMENT STAGES"));
    const stages = el("ol", "stage-list");
    for (const label of plan.deployment || []) stages.appendChild(el("li", "", typeof label === "string" ? label : label.action));
    process.appendChild(stages);
    const commands = el("section", "audit-block");
    commands.append(el("small", "", "EXPLICITLY AUTHORIZED SCIENTIFIC COMMANDS"));
    if (!(plan.authorized_commands || []).length) {
      commands.append(el("p", "audit-note", "No research execution commands approved"));
    } else {
      const executable = el("ul", "scope-list");
      for (const command of plan.authorized_commands) executable.append(el("li", "mono", command));
      commands.appendChild(executable);
    }
    area.append(basics, scope, commands, process);
    if (plan.implementation) {
      const code = el("section", "audit-block");
      code.append(el("small", "", "CODE REVIEW"));
      for (const file of plan.implementation.files || []) {
        code.appendChild(el("p", "source-detail", file.path + " · " + shortHash(file.sha256)));
      }
      area.appendChild(code);
    }
    if ((plan.observations || []).length) {
      const observed = el("section", "audit-block");
      observed.append(el("small", "", "RECORDED RESULTS · NODE COVERAGE"));
      for (const entry of plan.observations) {
        observed.appendChild(el("p", "source-detail", entry.result.path + " · " +
          shortHash(entry.result.sha256)));
        observed.appendChild(el("p", "audit-note", "Nodes: " +
          (entry.node_keys || []).join(", ")));
      }
      observed.appendChild(el("p", "audit-note",
        "Every accepted node needs independent scientific review."));
      area.appendChild(observed);
    }
  }
  function preciseDiff(before, after) {
    // Word-level in English, character-level for Han text; whitespace preserved.
    // Bounded dynamic programming keeps the review fast even on large plans.
    const tokenize = value =>
      String(value ?? "").match(/\s+|[\u3400-\u9fff]|[A-Za-z0-9_]+|[^\s]/gu) || [];
    const old = tokenize(before), next = tokenize(after);
    if (old.length > 240 || next.length > 240) {
      // For very long scientific descriptions, retain a bounded, readable diff.
      const a = String(before ?? ""), b = String(after ?? "");
      let prefix = 0, suffix = 0;
      while (prefix < Math.min(a.length,b.length) && a[prefix] === b[prefix]) prefix++;
      while (suffix < Math.min(a.length-prefix,b.length-prefix) &&
             a[a.length-1-suffix] === b[b.length-1-suffix]) suffix++;
      return [
        {kind:"equal",text:a.slice(0,prefix)},
        {kind:"removed",text:a.slice(prefix,a.length-suffix)},
        {kind:"added",text:b.slice(prefix,b.length-suffix)},
        {kind:"equal",text:suffix ? a.slice(a.length-suffix) : ""}
      ].filter(x => x.text);
    }
    const n = old.length, m = next.length;
    const dp = Array.from({length:n+1},() => new Uint16Array(m+1));
    for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--)
      dp[i][j]=old[i]===next[j] ? 1+dp[i+1][j+1] :
        Math.max(dp[i+1][j],dp[i][j+1]);
    const grouped = [];
    const push = (kind, text) => {
      if(grouped.length && grouped[grouped.length-1].kind === kind)
        grouped[grouped.length-1].text += text;
      else grouped.push({kind,text});
    };
    let i=0,j=0;
    while(i<n || j<m) {
      if(i<n && j<m && old[i]===next[j]) {
        push("equal",old[i]);i++;j++;
      } else if(j<m && (i===n || dp[i][j+1]>=dp[i+1][j])) {
        push("added",next[j++]);
      } else {
        push("removed",old[i++]);
      }
    }
    return grouped;
  }
  function compareField(parent, field, before, after, marks=[]) {
    const wrap = el("section", "diff-field");
    wrap.appendChild(el("div", "diff-label", field));
    const delta = preciseDiff(before,after);
    const previous = el("div","diff-before"),
          proposed = el("div","diff-after markable");
    for(const segment of delta) {
      if(segment.kind !== "added")
        previous.appendChild(el(segment.kind === "removed" ? "del" : "span",
                                "", segment.text));
      if(segment.kind !== "removed")
        proposed.appendChild(el(segment.kind === "added" ? "ins" : "span",
                                "", segment.text));
    }
    if (marks.length) {
      const highlighted = el("div","manual-highlights");
      highlighted.appendChild(el("small","", "Human-marked changes"));
      for (const mark of marks) highlighted.appendChild(el("mark","",mark));
      wrap.append(previous,proposed,highlighted);
    } else wrap.append(previous,proposed);
    parent.appendChild(wrap);
  }
  function field(parent, name, text) {
    const block = el("section", "diff-field");
    block.appendChild(el("div", "diff-label", name));
    block.appendChild(el("pre", "raw", typeof text === "string" ? text : JSON.stringify(text,null,2)));
    parent.appendChild(block);
  }
  function renderChange() {
    const area = $("nodeBody"); clear(area);
    const panel = $("decisionPanel");
    if (!plan) { $("nodeTitle").textContent = "Select a plan"; panel.hidden = true; return; }
    const item = plan.items.find(x => x.key === selected);
    if (!item) { $("nodeTitle").textContent = "Select a node"; panel.hidden = true; return; }
    $("currentView").textContent = item.view.toUpperCase() + " · " + item.operation.toUpperCase();
    $("nodeTitle").textContent = title(item);
    $("nodeStatus").textContent = item.state.replace(/_/g," ");
    $("nodeStatus").className = "node-state " + badge(item.state);
    const headline = el("div", "change-head " + badge(item.state));
    headline.append(el("span", "", "↳ " + item.node_id),
                    el("span", "", item.state === "not_implemented" ? "Proposed only" :
                      item.state === "partial" ? "Implementation partial" :
                      item.state === "implemented" ? "Human accepted" : "Discarded"));
    area.appendChild(headline);
    if (item.parent_id) field(area, "Planned position in tree", item.parent_id + " → " + item.node_id);
    if (item.operation === "add") {
      field(area, "New node · title", item.after?.title);
      field(area, "New node · content", item.after?.description);
    } else if (item.operation === "remove") {
      compareField(area, "Removal · node title", item.before?.title, "");
      compareField(area, "Removal · content", item.before?.description, "");
    } else {
      compareField(area, "Node title", item.before?.title, item.after?.title,
                   pendingMarks.get(item.key) || item.marks || []);
      compareField(area, "Node content", item.before?.description, item.after?.description,
                   pendingMarks.get(item.key) || item.marks || []);
    }
    for (const [key, value] of Object.entries(item.after || {})) {
      if (key !== "title" && key !== "description") field(area, "Proposed attribute · " + key, value);
    }
    if (item.before?.path) {
      const a = el("a", "source-link", "Inspect original " + item.before.path);
      a.href = "https://github.com/OpenSAE/OpenResearch/blob/main/" +
                item.before.path + (item.before.line ? "#L" + item.before.line : "");
      a.target = "_blank"; a.rel = "noopener noreferrer";
      area.appendChild(a);
    }
    const attached = (plan.observations || []).filter(r =>
      (r.node_keys || []).includes(item.key));
    if (attached.length) {
      const results = el("section", "diff-field");
      results.appendChild(el("div", "diff-label", "Node-specific observed evidence"));
      for (const record of attached)
        results.appendChild(el("p", "source-detail", record.result.path + " · " + shortHash(record.result.sha256)));
      area.appendChild(results);
    }
    if (item.reviewer) {
      field(area, "Human disposition", item.decision + " · " +
            item.reviewer.actor + "\n" + (item.reviewer.reason || ""));
    }
    panel.hidden = false;
    $("marks").textContent = (pendingMarks.get(item.key) || item.marks || []).join(" · ");
    const allowed = plan.phase === "partial" || plan.phase === "review";
    panel.querySelectorAll("[data-decision]").forEach(b => {
      b.disabled = !allowed || (b.dataset.decision === "approve" && !isReady(item));
    });
    $("permissionNote").textContent = local ?
      "Review decisions are written instantly to the local plan ledger." :
      "Static mode is a draft only. Export decisions, submit through a GitHub PR, and obtain maintainer review.";
  }
  function paint() {
    if (!plan) return;
    $("planTitle").textContent = plan.id;
    $("planGoal").textContent = plan.goal;
    $("phase").textContent = plan.phase.replace(/_/g," ");
    $("phase").className = "phase phase-" + plan.phase;
    revNote(); renderQueue(); treeOverview(); renderAudit(); renderChange();
    $("authorize").disabled = plan.phase !== "preflight";
    $("authorize").textContent = local ? "Authorize this scoped plan" : "Prepare GitHub approval receipt";
    $("finalize").disabled = !local || !["review","partial"].includes(plan.phase) ||
      plan.items.some(x => !x.decision);
    $("export").disabled = false;
  }
  async function post(action, payload) {
    if (!local) throw Error("Static view: download draft and submit through GitHub PR");
    const response = await fetch("/api/action", {
      method:"POST", credentials:"same-origin",
      headers:{"Content-Type":"application/json","X-Review-Token":token},
      body: JSON.stringify({revision:plan.revision, action, actor:$("actor").value.trim(), ...payload})
    });
    const obj = await response.json();
    if (!response.ok) throw Error(obj.error || "Review failed");
    plan = obj.plan;
    pendingMarks.clear(); paint();
    signal(action + " recorded. Revision " + plan.revision);
  }
  function draftDecision(item, action, marks, actor, reason) {
    if (action === "approve" && !isReady(item)) throw Error("Actual results are required for green");
    item.decision = action;
    item.state = {approve:"implemented", keep_partial:"partial",
                  retry:"not_implemented",delete:"deleted"}[action];
    item.marks = marks;
    item.reviewer = {actor, reason, channel:"static_pr_draft"};
    staged.push({key:item.key,decision:action,actor,reason,marks});
    paint();
    signal("Draft only. Export and submit a PR to make this decision auditable.");
  }
  function chosen() { return plan?.items.find(x => x.key === selected); }
  function humanFields() {
    const actor = $("actor").value.trim(), reason = $("reason").value.trim();
    if (actor.length < 2) throw Error("Enter the human reviewer identity");
    return {actor,reason,marks:pendingMarks.get(selected) || chosen()?.marks || []};
  }
  function download(data, filename) {
    const blob = new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = el("a"); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function refresh() {
    if (!local) return;
    try {
      const r=await fetch("/api/state",{cache:"no-store"});
      if (!r.ok) return;
      const payload=await r.json();
      if (!plan || payload.plan.revision !== plan.revision) {
        plan=payload.plan;token=payload.token;
        if (!chosen()) selected=plan.items[0]?.key || null;
        paint();
      }
    } catch (_) {}
  }
  async function loadPublicDemo() {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") !== "knowledge-node") return false;
    const response = await fetch("./demo-knowledge-plan.json", {cache:"no-store"});
    if (!response.ok) throw new Error("Knowledge demo plan is unavailable");
    const record = await response.json();
    if (!valid(record)) throw new Error("Demo review ledger is invalid");
    plan = record; local = false; token = null; staged = []; stagedAuthorization = false;
    selected = plan.items[0]?.key || null; filter = "knowledge";
    document.querySelectorAll(".view").forEach(node =>
      node.classList.toggle("current", node.dataset.view === "knowledge"));
    paint();
    signal("Demo · 待人类批阅；预览不会自动执行批准或修改正式 Knowledge Tree。");
    return true;
  }

  async function init() {
    try {
      const r=await fetch("/api/state",{cache:"no-store"});
      if (r.ok) {
        const payload=await r.json();
        if (valid(payload.plan)) {
          local=true;token=payload.token;plan=payload.plan;
          selected=plan.items[0]?.key;paint();
        }
      }
    } catch (_) {} // A static file can be reviewed with an uploaded JSON plan.
    if (!local) {
      try { await loadPublicDemo(); }
      catch (error) { signal(error.message, true); }
    }
    document.querySelectorAll(".view").forEach(button => button.addEventListener("click", () => {
      filter=button.dataset.view;
      document.querySelectorAll(".view").forEach(x=>x.classList.toggle("current",x===button));
      const nodes=plan?.items.filter(x=>filter==="all"||x.view===filter) || [];
      if (!nodes.some(x=>x.key===selected)) selected=nodes[0]?.key || null;
      paint();
    }));
    $("planFile").addEventListener("change", async e => {
      try {
        const file=e.target.files?.[0];if (!file) return;
        const obj=JSON.parse(await file.text());
        if (!valid(obj)) throw Error("Expected a complete audited agent_flow ledger");
        plan=obj;local=false;token=null;staged=[];stagedAuthorization=false;
        selected=plan.items[0]?.key || null;paint();signal("Static preview loaded");
      } catch (error) { signal(error.message,true); }
      e.target.value="";
    });
    $("search").addEventListener("input",e=>{search=e.target.value||"";renderQueue();});
    $("mark").addEventListener("click",()=>{
      const current=chosen();
      if (!current) return;
      const selectedText=window.getSelection()?.toString().trim() || "";
      if (!selectedText) return signal("Select text in a proposed field first",true);
      const candidate=[...Object.values(current.after||{}),
        ...Object.values(current.before||{})].map(String).join(" ");
      if (!candidate.includes(selectedText)) return signal("Mark must be within the proposed content",true);
      const marks=pendingMarks.get(current.key) || [...(current.marks||[])];
      if (!marks.includes(selectedText)) marks.push(selectedText.slice(0,300));
      pendingMarks.set(current.key,marks);renderChange();signal("Human mark added");
    });
    document.querySelectorAll("[data-decision]").forEach(button => {
      button.addEventListener("click",async()=>{
        try {
          const row=chosen();if(!row) return;
          const data=humanFields();
          if (button.dataset.decision === "approve" && data.reason.length < 8)
            throw Error("State why you accept the real experiment result");
          if (local) await post("decision",{key:row.key,decision:button.dataset.decision,
                                           marks:data.marks,reason:data.reason});
          else draftDecision(row,button.dataset.decision,data.marks,data.actor,data.reason);
        } catch (err) {signal(err.message,true);}
      });
    });
    $("authorize").addEventListener("click",async()=>{
      try {if(!confirm("Authorize ONLY these exact files and scientific commands? Core/rules remain locked."))return;
        if(local) await post("authorize",{});
        else {const who=$("actor").value.trim();if(who.length<2)throw Error("Enter a reviewer name");stagedAuthorization=true;
          signal("Draft only: export an authorization receipt, submit a one-file GitHub PR, obtain human approval.");}}catch(err){signal(err.message,true);}
    });
    $("finalize").addEventListener("click",async()=>{
      try {await post("finalize",{});}catch(err){signal(err.message,true);}
    });
    $("export").addEventListener("click",()=>{
      if (!plan) return;
      if (local) download(plan,plan.id+".review-snapshot.json");
      else download({schema:"openresearch.agent_flow.decisions.v1",id:plan.id,
        preview_sha256:plan.preview_sha256,authorize:stagedAuthorization,
        decisions:staged,finalize:staged.length>0 && plan.items.every(x=>!!x.decision),
        note:"Draft for an explicitly human-approved GitHub PR; not applied."},
        plan.id+".review-decisions.json");
    });
    window.addEventListener("keydown",event=>{
      if(!plan||["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
      const items=plan.items.filter(x=>filter==="all"||x.view===filter);
      const current=items.findIndex(x=>x.key===selected);
      if(event.key==="j"||event.key==="ArrowDown"){selected=items[(current+1)%items.length]?.key;paint();}
      if(event.key==="k"||event.key==="ArrowUp"){selected=items[(current-1+items.length)%items.length]?.key;paint();}
      if(event.key==="/"){event.preventDefault();$("search").focus();}
    });
    setInterval(refresh,4000);
  }
  init();
})();
