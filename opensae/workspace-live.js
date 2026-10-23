(() => {
  'use strict';
  let endpoint = '', currentJob = '', graph = null, lastTrace = null;
  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = String(text); if (className) node.className = className; return node; };
  const clear = id => { const node = $(id); if (node) node.replaceChildren(); return node; };
  const message = (id, text, error = false) => { const node = clear(id); node.append(el('p', text, error ? 'api-error' : 'api-message')); };
  const item = (root, label, value) => { const p = el('div', '', 'api-pair'); p.append(el('span', label), el('strong', value ?? '—')); root.append(p); return p; };
  const num = n => typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(4)).toString() : '—';
  const requireAPI = () => { if (!endpoint) throw Error('Connect a GPU service to run this operation.'); return endpoint; };
  const STATIC_PATH = 'data/wp15/';
  async function staticRecord(name) {
    if (!['benchmark','training','generation','circuit','explanation'].includes(name)) throw Error('Unknown result.');
    const response = await fetch(STATIC_PATH + name + '.json', {cache:'no-store'});
    if (!response.ok) throw Error('Could not load published measurements.');
    return response.json();
  }
  async function request(path, { method = 'GET', body, privateAuth = false } = {}) {
    const base = requireAPI();
    const headers = { 'Accept': 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (privateAuth) { const token = $('operator-token').value.trim(); if (!token) throw Error('Enter your operator token.'); headers.Authorization = 'Bearer ' + token; }
    const response = await fetch(base + path, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: 'no-store', credentials: 'omit', mode: 'cors' });
    let payload = null;
    try { payload = await response.json(); } catch { throw Error('The API did not return JSON.'); }
    if (!response.ok) throw Error(typeof payload.detail === 'string' ? payload.detail : `API error ${response.status}`);
    return payload;
  }
  const act = (id, task) => { $(id)?.addEventListener('click', async e => { e.preventDefault(); try { await task(); } catch (err) { message(id.includes('circuit') ? 'circuit-results' : id.includes('edit') ? 'edit-results' : 'explore-results', err.message, true); } }); };
  function connected() {
    const online = Boolean(endpoint);
    $('api-status').textContent = online ? 'Connected' : 'Not connected';
    $('feature-query').placeholder = online ? 'Feature ID or description' : 'Feature ID';
    ['load-sites', 'load-traces', 'load-generation', 'load-circuit', 'load-benchmark', 'load-training', 'load-interpret']
      .forEach(id => { $(id).hidden = !online; });
    $('edit-check').disabled = !online;
    $('edit-form').querySelector('button[type=submit]').disabled =
      !online || !$('operator-token').value.trim() || !$('edit-form').checkValidity();
  }
  $('operator-token').addEventListener('input', connected);
  $('edit-form').addEventListener('input', connected);
  $('edit-form').addEventListener('change', connected);
  connected();
  $('api-connect').addEventListener('click', async () => {
    const field = $('api-base');
    try {
      const url = new URL(field.value.trim());
      if (url.username || url.password || url.search || url.hash) throw Error('Use only the API origin, without credentials or query strings.');
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw Error('Use HTTPS, or localhost for local development.');
      endpoint = url.href.replace(/\/$/, '');
      $('api-status').textContent = 'Connecting';
      await request('/api/health');
      connected();
      clear('explore-results');
    } catch (err) { endpoint = ''; connected(); $('api-status').textContent = err.message.includes('fetch') ? 'Cannot reach service' : err.message; }
  });
  async function sites() {
    const data = await request('/api/sites?limit=60'); const root = clear('explore-results');
    const rows = Array.isArray(data.items) ? data.items : [];
    if (!rows.length) return message('explore-results', 'No verified model sites available.');
    rows.forEach(row => { const b = el('button', row.site_id, 'api-list-button'); b.type = 'button'; b.addEventListener('click', () => { $('edit-site').value = row.site_id; $('edit-compute').open = true; document.querySelector('[data-module="intervene"]')?.click(); connected(); }); root.append(b); });
  }
  async function traces() {
    const data = await request('/api/explore/traces'); const rows = Array.isArray(data.items) ? data.items : []; const root = clear('explore-results');
    if (!rows.length) return message('explore-results', 'No published prompts on this API.');
    for (const trace of rows) {
      const b = el('button', trace.prompt_text || trace.sample_id || trace.trace_id, 'api-list-button'); b.type = 'button';
      b.addEventListener('click', () => loadTrace(trace.trace_id).catch(e => message('token-inspector', e.message, true))); root.append(b);
    }
  }
  async function loadTrace(id) {
    const trace = await request('/api/explore/traces/' + encodeURIComponent(id));
    loadTraceRow(trace);
  }
  function loadTraceRow(trace) { lastTrace = trace;
    const root = clear('token-inspector'); root.append(el('h2', 'Tokens'));
    const tokens = el('div', '', 'api-tokens'); root.append(tokens);
    for (const token of (trace.tokens || [])) {
      const button = el('button', token.text || `#${token.token_id}`, 'api-token'); button.type = 'button';
      button.title = 'Token ' + token.position;
      button.addEventListener('click', () => {
        tokens.querySelectorAll('button').forEach(b => b.classList.remove('selected')); button.classList.add('selected');
        const out = root.querySelector('.api-features') || el('div', '', 'api-features'); out.replaceChildren(); out.append(el('h3', 'Features'));
        (token.features || []).sort((a,b) => Math.abs(b.activation)-Math.abs(a.activation)).slice(0,20).forEach(f => {
          const b = el('button', `Feature ${f.feature_id} · ${num(f.activation)}`, 'api-list-button'); b.type = 'button';
          b.addEventListener('click', () => { $('edit-site').value = trace.site_id; $('edit-feature').value = f.feature_id; $('edit-prompt').value = trace.prompt_text || ''; $('edit-compute').open = true; document.querySelector('[data-module="intervene"]')?.click(); connected(); }); out.append(b);
        });
        root.append(out);
      }); tokens.append(button);
    }
    if (!trace.tokens?.length) root.append(el('p', 'No tokens found.'));
  }
  $('load-sites').addEventListener('click', () => {if (!endpoint) return message('explore-results','Connect a compute service to browse models.'); sites().catch(e => message('explore-results', e.message, true));});
  $('load-traces').addEventListener('click', () => {if (!endpoint) return message('explore-results','Open a trace JSON file or connect a compute service.'); traces().catch(e => message('explore-results', e.message, true));});
  $('trace-file').addEventListener('change',async ev=>{
    const file=ev.target.files?.[0]; if(!file)return;
    try {
      if(file.size>8*1024*1024) throw Error('Trace exceeds 8 MB.');
      const row=JSON.parse(await file.text());
      if(!row||!Array.isArray(row.tokens)||row.tokens.length>128||typeof row.site_id!=='string')throw Error('Not a SAEBase trace.');
      for(const t of row.tokens)if(!Array.isArray(t.features)||t.features.length>256||!Number.isInteger(t.token_id))throw Error('Invalid token or feature row.');
      loadTraceRow(row); message('explore-results', 'Loaded '+(row.sample_id||'trace')+' from your computer.');
    } catch(err){message('explore-results',err.message,true)}
  });
  $('explore-search').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const q = $('feature-query').value.trim(); if (!q) throw Error('Enter a feature or explanation.');
      if (!endpoint) {
        const featureId = Number(q);
        if (!lastTrace) {
          if (!/^\d+$/.test(q)) throw Error('Enter a feature ID.');
          const out = clear('feature-results');
          const generation = await staticRecord('generation');
          const circuit = await staticRecord('circuit');
          const samples = (generation.samples || []).filter(row => row.feature_id === featureId);
          const nodes = (circuit.graph?.nodes || []).filter(node => node.feature_id === featureId);
          if (samples.length) {
            const b = el('button', 'Feature ' + featureId + ' · Generation', 'api-list-button');
            b.type = 'button'; b.addEventListener('click', () => document.querySelector('[data-module="generate"]')?.click());
            out.append(b);
          }
          if (nodes.length) {
            const b = el('button', 'Feature ' + featureId + ' · Circuit (' + nodes.length + ' nodes)', 'api-list-button');
            b.type = 'button'; b.addEventListener('click', () => document.querySelector('[data-module="circuits"]')?.click());
            out.append(b);
          }
          if (!samples.length && !nodes.length) out.append(el('p', 'No matching features in the available results.'));
          return;
        }
        if (!Number.isInteger(featureId) || featureId < 0) throw Error('Enter a feature ID.');
        const out=clear('feature-results'); let matches=0;
        for (const t of lastTrace.tokens || []) {
          const f=(t.features||[]).find(f=>f.feature_id===featureId); if (!f) continue; matches++;
          const b=el('button', `${t.text || '#' + t.token_id} · Feature ${featureId} · ${num(f.activation)}`, 'api-list-button');
          b.addEventListener('click',()=>{$('edit-feature').value=featureId;$('edit-site').value=lastTrace.site_id;$('edit-prompt').value=lastTrace.prompt_text||'';$('edit-compute').open=true;document.querySelector('[data-module=intervene]')?.click();connected();});out.append(b);
        }
        if (!matches) out.append(el('p','No matching tokens.'));
        return;
      }
      const data = await request('/api/features?q=' + encodeURIComponent(q) + '&limit=20');
      const root = clear('feature-results'), rows = data.items || [];
      if (!rows.length) root.append(el('p', 'No matching features.'));
      rows.forEach(row => { const b=el('button', `${row.site_id || ''} · Feature ${row.feature_id ?? row.id}`, 'api-list-button'); b.type='button'; b.addEventListener('click', () => { $('edit-site').value = row.site_id || ''; $('edit-feature').value = row.feature_id ?? row.id; $('edit-compute').open = true; document.querySelector('[data-module="intervene"]')?.click(); connected(); }); root.append(b); });
    } catch(e) { message('feature-results', e.message, true); }
  });
  const editBody = () => ({ site_id: $('edit-site').value.trim(), text: $('edit-prompt').value, operation: $('edit-operation').value, feature_ids: [Number($('edit-feature').value)], strength: Number($('edit-strength').value), max_new_tokens: 0 });
  $('edit-check').addEventListener('click', async () => {
    try { if (!endpoint) throw Error('Connect a compute service to validate a model edit.'); const r = await request('/api/jobs/preflight', {method:'POST', body:editBody()}); const root = clear('edit-results'); item(root, 'Validation', r.status || 'Accepted'); if (r.site_id) item(root, 'Site', r.site_id); root.append(el('p','Validation does not execute an intervention.')); } catch(e){message('edit-results',e.message,true)}
  });
  $('edit-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      if (!$('edit-form').reportValidity()) return;
      const b = editBody(); if (!Number.isInteger(b.feature_ids[0]) || b.feature_ids[0] < 0) throw Error('Select a valid feature.');
      const saved = await request('/api/private/inputs',{method:'POST',body:{text:b.text},privateAuth:true});
      const job = await request('/api/private/jobs',{method:'POST',body:{client_key:(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),site_id:b.site_id,operation:b.operation,feature_ids:b.feature_ids,strength:b.strength,input_ref:saved.input_ref,max_new_tokens:0},privateAuth:true});
      currentJob = job.job_id || job.id || ''; if (!currentJob) throw Error('The worker did not return a job ID.');
      $('edit-refresh').hidden = false; message('edit-results','Job ' + currentJob + ' submitted. Select Refresh job for results.');
    } catch(e){message('edit-results',e.message,true)}
  });
  $('edit-refresh').addEventListener('click', async () => {
    if (!currentJob) return;
    try { const status=await request('/api/private/jobs/'+encodeURIComponent(currentJob),{privateAuth:true}); const root=clear('edit-results'); item(root,'Job',status.status||'Unknown'); if(status.status==='succeeded'){const result=await request('/api/private/jobs/'+encodeURIComponent(currentJob)+'/result',{privateAuth:true}); for(const key of ['logit_delta_l2','max_abs_logit_delta','baseline_argmax_token_id','edited_argmax_token_id'])if(result[key]!==undefined)item(root,key.replaceAll('_',' '),num(result[key]));} }catch(e){message('edit-results',e.message,true)}
  });
  const records = async(name,id,show) => {try{const r=endpoint ? await request('/api/wp15/'+name) : await staticRecord(name);show(clear(id),r);}catch(e){message(id,e.message,true)}};
  $('load-generation').addEventListener('click', () => records('generation','generation-results',(root,r)=>{
    (r.samples||[]).forEach(s => {const box=el('div','','api-measure');box.append(el('h2','Feature '+s.feature_id));
      for(const c of s.conditions||[]) {const row=el('div','','api-pair');item(row,c.name, c.argmax_changed ? 'Token changed' : c.same_continuation ? 'Same continuation' : 'Logits changed');if(c.step0_max_abs_logit_delta!==undefined)item(row,'Max Δ logit',num(c.step0_max_abs_logit_delta));box.append(row)}
      if(s.public_example && r.rights_reviewed === true)for(const k of ['prompt_text','baseline_continuation','edited_continuation'])item(box,k.replaceAll('_',' '),s.public_example[k]);root.append(box);
    }); if(!r.samples?.length)root.append(el('p','No generation results.'));
  }));
  function drawCircuit() {
    const svg=$('live-circuit');svg.replaceChildren();if(!graph)return;
    const threshold=Number($('edge-threshold').value),nodes=graph.nodes||[],edges=(graph.edges||[]).filter(e=>Math.abs(e.weight||0)>=threshold);const coords=new Map();
    const layers=[...new Set(nodes.map(n=>Number.isInteger(n.layer)?n.layer:-1))].sort((a,b)=>a-b);
    const groups=new Map(layers.map(l=>[l, nodes.filter(n=>(Number.isInteger(n.layer)?n.layer:-1)===l)]));
    for(const [li,layer] of layers.entries()){const ns=groups.get(layer);ns.forEach((n,i)=>coords.set(n.id,{x:42+li*816/Math.max(1,layers.length-1),y:26+(i+1)*464/(ns.length+1)}));}
    const ns='http://www.w3.org/2000/svg';for(const e of edges){const a=coords.get(e.source),b=coords.get(e.target);if(!a||!b)continue;const path=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:e.weight<0?'#9f8b80':'#667d9a','stroke-width':1,opacity:.55}))path.setAttribute(k,String(v));svg.append(path)}
    for(const n of nodes){const xy=coords.get(n.id);if(!xy)continue;const c=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:xy.x,cy:xy.y,r:n.kind==='logit'?6:3.7,fill:n.kind==='error'?'#b37965':'#215b83',tabindex:0,role:'button','aria-label':n.label||n.id}))c.setAttribute(k,String(v));
      const inspect = () => { const out=clear('circuit-selection');item(out,'Node',n.id);item(out,'Type',n.kind);if(n.label)item(out,'Label',n.label); };
      c.addEventListener('click',inspect);
      c.addEventListener('keydown',event => {if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect();}});
      svg.append(c)}
  }
  $('edge-threshold').addEventListener('input',drawCircuit);
  $('load-circuit').addEventListener('click', () => records('circuit','circuit-results',(root,r)=>{graph=r.graph;item(root,'Model',r.model);item(root,'Nodes',graph.nodes?.length);item(root,'Edges',graph.edges?.length);drawCircuit()}));
  $('load-benchmark').addEventListener('click', () => records('benchmark','benchmark-results',(root,r)=>{item(root,'Model',r.model_name);item(root,'SAE',r.sae_id);for(const [k,v]of Object.entries(r.metrics||{}))item(root,k,num(v))}));
  $('load-training').addEventListener('click', () => records('training','training-results',(root,r)=>{for(const [k,v] of Object.entries({Backend:r.backend,Architecture:r.architecture,Steps:r.global_step,Reloaded:r.reloaded,Reconstruction_MSE:r.reconstruction_mse}))item(root,k,num(v) === '—' ? String(v) : num(v));}));
  $('load-interpret').addEventListener('click', () => records('explanation','interpret-results',(root,r)=>{item(root,'Feature',r.feature_id);item(root,'Held-out score',num(r.heldout_score));if(r.approved===true&&r.description_published===true&&r.rights_reviewed===true)item(root,'Interpretation',r.description);}));
  async function loadInterventionResult() {
    try {
      const r = await staticRecord('generation');
      const out = clear('edit-existing');
      const changed = (r.samples || []).flatMap(sample =>
        (sample.conditions || []).filter(condition => condition.name === 'ablate' && condition.argmax_changed)
          .map(condition => ({sample, condition})));
      if (!changed.length) return;
      const {sample, condition} = changed[0];
      out.append(el('h2', 'Feature ' + sample.feature_id));
      item(out, 'Intervention', 'Ablation');
      item(out, 'Next token', 'Changed');
      item(out, 'Maximum logit change', num(condition.step0_max_abs_logit_delta));
      const link = el('button', 'View generation', 'api-list-button');
      link.type = 'button';
      link.addEventListener('click', () => document.querySelector('[data-module="generate"]')?.click());
      out.append(link);
    } catch (error) { message('edit-existing', error.message, true); }
  }
  loadInterventionResult();
  // Existing results load automatically; refresh controls appear only for a connected API.
  ['load-generation','load-circuit','load-benchmark','load-training','load-interpret'].forEach(id=>$(id)?.click());
})();
