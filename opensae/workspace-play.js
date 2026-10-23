(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const create = (tag, text = '', cls = '') => { const node = document.createElement(tag); if (text !== undefined) node.textContent = String(text); if (cls) node.className = cls; return node; };
  const reset = id => { const node = $(id); if (node) node.replaceChildren(); return node; };
  const fmt = v => Number.isFinite(v) ? Number(v.toFixed(3)).toLocaleString('en-US') : '—';
  const prompts = {
    boats: 'Blue paper boats drifted under the stone bridge after the rain.',
    night: 'The night clerk counted the brass keys before locking the side door.',
    sensor: 'The sensor reading rose from seven to twelve after calibration.'
  };
  const baseline = {
    boats: '\n\nThe boat was a blue paper boat, and the bridge was a stone bridge',
    night: '\n\nThe door was open, and the door was locked.\n\nThe door was',
  };
  const after = {
    boats: '<start_of_image>The boat was a blue paper boat, and the boat was a blue paper',
    night: '\n\nThe door was open, and the door was locked.\n\nThe door was',
  };
  let apiOrigin = '', queuedJob = '', circuit = null, activeModule = 'explore', lastSelectedToken = 0;
  const source = 'data/wp15/';
  const out = (id, fn) => { const node=reset(id); try{fn(node);}catch(err){node.append(create('p',err.message,'play-failure'));} };
  const status = (node, value, demo = true) => { const p=create('p','','demo-status');p.append(create('strong',demo?'Demo · ':'Measured · '),document.createTextNode(value));node.append(p); };
  const paragraph = (node, text, cls) => {const p=create('p',text,cls);node.append(p);return p};
  const metric = (root, label, value) => {const d=create('div','','measure');d.append(create('span',label,'measure-name'),create('strong',value));root.append(d);};
  const metrics = (root, values) => {const row=create('div','','measure-row');Object.entries(values).forEach(([k,v])=>metric(row,k,v));root.append(row);};
  const card = (node, title, copy) => {const div=create('div'); div.append(create('h4',title),create('p',copy));node.append(div)};
  const comparison = (root, first, a, second, b) => {const wrap=create('div','','comparison');card(wrap,first,a);card(wrap,second,b);root.append(wrap)};
  function showModule(name) {
    if(!document.querySelector(`[data-pane="${name}"]`))return;
    activeModule=name;
    document.querySelectorAll('#workspace-nav [data-module]').forEach(btn=>{const yes=btn.dataset.module===name;btn.classList.toggle('active',yes);btn.setAttribute('aria-current',yes?'page':'false')});
    document.querySelectorAll('.workspace-panel').forEach(panel=>{panel.classList.toggle('active',panel.dataset.pane===name);panel.hidden=panel.dataset.pane!==name});
    const methods={explore:runExplore,intervene:runIntervene,generate:runGenerate,circuits:runCircuit,benchmarks:runBenchmark,training:runTraining,interpret:runInterpret};
    methods[name]?.(); try { history.replaceState(null,'',location.pathname+'?module='+name); } catch {}
  }
  document.querySelectorAll('#workspace-nav [data-module]').forEach(btn=>btn.addEventListener('click',()=>showModule(btn.dataset.module)));
  const getWords=text=>text.trim().match(/[\w]+|[^\w\s]/g)||[];
  const seed=(s)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
  const fakeFeature=(word,pos,base)=>{const h=seed(word+':'+pos+':'+base);return {id:(h%32000),activation:Number(((h%7500)/100+1).toFixed(2))}};
  function runExplore(){
    const prompt=$('explore-prompt').value.trim();out('explore-output',root=>{
      if(!prompt)throw Error('Enter a prompt.');const words=getWords(prompt).slice(0,64);if(!words.length)throw Error('Enter a prompt.');
      root.append(create('h3','Token activations'));
      const bar=create('div','','play-tokens'),detail=create('div');root.append(bar,detail);
      function focus(i){lastSelectedToken=i;bar.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i));detail.replaceChildren();const w=words[i];detail.append(create('h3',`“${w}”`));const f=[fakeFeature(w,i,1819),fakeFeature(w,i,1627),fakeFeature(w,i,1680)].sort((a,b)=>b.activation-a.activation);
        const list=create('div','','feature-list');f.forEach(v=>{const b=create('button',`Feature ${v.id} →   ${fmt(v.activation)}`);b.type='button';b.addEventListener('click',()=>{$('intervene-feature').value=v.id;$('intervene-example').value=$('explore-example').value;showModule('intervene')});list.append(b)});detail.append(list);
        status(detail,'Illustrative feature activations. Replace with live SAE codes.',true);
      }
      words.forEach((w,i)=>{const b=create('button',w);b.type='button';b.title='Inspect '+w;b.addEventListener('click',()=>focus(i));bar.append(b)});focus(Math.min(lastSelectedToken,words.length-1));
    });
  }
  $('explore-example').addEventListener('change',()=>{$('explore-prompt').value=prompts[$('explore-example').value];lastSelectedToken=0;runExplore()});
  $('explore-run').addEventListener('click',()=>{lastSelectedToken=0;runExplore()});
  $('explore-reset').addEventListener('click',()=>{$('explore-example').value='boats';$('explore-prompt').value=prompts.boats;lastSelectedToken=0;runExplore()});
  function runIntervene(){out('intervene-output',root=>{
    const key=$('intervene-example').value,op=$('intervene-operation').value,strength=Number($('intervene-strength').value),id=Number($('intervene-feature').value);
    if(!Number.isInteger(id)||id<0)throw Error('Choose a valid feature.');if(!Number.isFinite(strength)||strength<0||strength>10)throw Error('Strength must be between 0 and 10.');
    const sourceMatch=key==='boats'&&id===1819&&op==='ablate';
    let change=sourceMatch?9.802836:(id%23+12)*0.15*(op==='ablate'?1:op==='scale'?strength/2:op==='clamp'?Math.min(strength,4)/3:strength/3);
    if(op==='scale'&&strength===1)change=0;
    root.append(create('h3',op==='ablate'?'Feature ablation':op==='scale'?'Feature scaling':op==='clamp'?'Feature clamp':'Feature addition'));
    metrics(root,{'Feature':String(id),'Max logit change':fmt(change),'Next token':sourceMatch?'108 → 255999':change<.1?'Unchanged':'May change'});
    const label=sourceMatch?'Measured WP15 ablation at this feature and prompt.':'Illustrative edit response. Strength and feature are adjustable.';
    status(root,label,!sourceMatch);
  });}
  $('intervene-example').addEventListener('change',()=>{$('intervene-feature').value=$('intervene-example').value==='sensor'?'1627':'1819';runIntervene()});
  $('intervene-run').addEventListener('click',runIntervene);
  for(const k of ['intervene-operation','intervene-strength','intervene-feature'])$(k).addEventListener('change',runIntervene);
  $('intervene-generation').addEventListener('click',()=>{$('generate-example').value=$('intervene-example').value==='sensor'?'boats':$('intervene-example').value;$('generate-prompt').value=prompts[$('generate-example').value];$('generate-operation').value=$('intervene-operation').value==='scale'?'scale':'ablate';showModule('generate')});
  function runGenerate(){out('generate-output',root=>{
    const key=$('generate-example').value,operation=$('generate-operation').value,prompt=$('generate-prompt').value.trim();if(!prompt)throw Error('Enter a prompt.');
    const match=prompt===prompts[key];const clean=match?baseline[key]:'\nThe model continues the selected prompt.';
    const edited=operation==='noop'?clean:match&&operation==='ablate'?after[key]:operation==='scale'&&match?clean:'\nThe edited model produces a different possible continuation.';
    root.append(create('h3','Generated continuation'));comparison(root,'Baseline',clean,operation==='noop'?'No change':operation==='scale'?'Scaled ×2':'After ablation',edited);
    metrics(root,{'First-token change':operation==='ablate'&&match&&key==='boats'?'Yes':'No','Maximum logit change':match?(operation==='noop'?'0':key==='boats'?(operation==='ablate'?'9.803':'5.423'):(operation==='ablate'?'7.648':'5.198')):'—'});
    status(root,match?'WP15 measured continuations for the original prompt.':'Illustrative continuation; edit the example to run a live model later.',!match);
  });}
  $('generate-example').addEventListener('change',()=>{$('generate-prompt').value=prompts[$('generate-example').value];runGenerate()});$('generate-operation').addEventListener('change',runGenerate);$('generate-run').addEventListener('click',runGenerate);
  async function fetchRecord(name){let r=await fetch(source+name+'.json',{cache:'no-store'});if(!r.ok)throw Error('Could not load '+name+' data.');return r.json()}
  let circuitLoading=null;
  async function runCircuit(){
    try{if(!circuit){circuitLoading??=fetchRecord('circuit');circuit=await circuitLoading;}const graph=circuit.graph||{};const nodes=graph.nodes||[],allEdges=graph.edges||[],minimum=Number($('circuit-weight').value);$('weight-label').textContent=String(minimum);
      const edges=allEdges.filter(x=>Math.abs(x.weight||0)>=minimum);out('circuit-summary',root=>{metrics(root,{'Model':circuit.model||'Gemma 2 · 2B','Nodes':String(nodes.length),'Visible edges':String(edges.length)});status(root,'Native Circuit Tracer graph, filtered by edge weight.',false)});
      const svg=$('play-circuit');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';const coords=new Map();const layers=[...new Set(nodes.map(n=>Number.isInteger(n.layer)?n.layer:-1))].sort((a,b)=>a-b);const buckets=new Map(layers.map(l=>[l,nodes.filter(n=>(Number.isInteger(n.layer)?n.layer:-1)===l)]));
      for(const [li,layer] of layers.entries()){const row=buckets.get(layer);row.forEach((n,i)=>coords.set(n.id,{x:35+li*930/Math.max(1,layers.length-1),y:12+(i+1)*490/(row.length+1)}))}
      function sv(tag,attrs){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el}
      for(const e of edges){const a=coords.get(e.source),b=coords.get(e.target);if(a&&b)sv('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:e.weight<0?'#9b7f76':'#91a2b8','stroke-width':Math.min(2,0.5+Math.abs(e.weight)/24),opacity:'.48'})}
      for(const n of nodes){const xy=coords.get(n.id);if(!xy)continue;const circle=sv('circle',{cx:xy.x,cy:xy.y,r:n.kind==='logit'?6:n.kind==='error'?5:3.7,fill:n.kind==='error'?'#925750':'#215b83',tabindex:'0',role:'button','aria-label':'Open node '+n.id});const open=()=>out('circuit-detail',root=>{metrics(root,{'Node':n.id,'Type':n.kind||'feature', 'Layer':Number.isInteger(n.layer)?String(n.layer):'—'});if(n.label)paragraph(root,n.label)});circle.addEventListener('click',open);circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})}
    }catch(e){out('circuit-summary',root=>paragraph(root,e.message,'play-failure'))}
  }
  $('circuit-run').addEventListener('click',runCircuit);$('circuit-weight').addEventListener('input',runCircuit);
  let benchmarkRecord=null;
  async function runBenchmark(){try{benchmarkRecord??=await fetchRecord('benchmark');const m=benchmarkRecord.metrics||{};const key=$('benchmark-metric').value;const entries={l0:['Active features (L0)',m['saebench.core.l0'],'features'],mse:['Reconstruction MSE',m['saebench.core.mse'],''],probe:['Sparse probing accuracy',m['saebench.sparse_probing.sae_top_1_test_accuracy'],'%']};const [label,value,suffix]=entries[key];out('benchmark-output',root=>{root.append(create('h3',label));metrics(root,{[label]:suffix==='%'?fmt(value*100)+'%':fmt(value),'Model':benchmarkRecord.model_name||'Pythia 70M','SAE':benchmarkRecord.sae_id||'Layer 3'});const bar=create('div','','bar-track'),fill=create('div','','bar-fill');fill.style.width=(key==='probe'?Math.min(value*100,100):key==='mse'?Math.min(value*1000,100):Math.min(value/5,100))+'%';bar.append(fill);root.append(bar);status(root,'Original SAEBench result. Selecting a metric does not rerun evaluation.',false)});}catch(e){out('benchmark-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('benchmark-run').addEventListener('click',runBenchmark);$('benchmark-metric').addEventListener('change',runBenchmark);
  let trainingRecord=null;
  async function runTraining(){try{trainingRecord??=await fetchRecord('training');const r=trainingRecord;const config={architecture:$('train-architecture').value,k:Number($('train-k').value),steps:Number($('train-steps').value)};const actual=config.architecture==='topk'&&config.k===32&&config.steps===50;const mse=actual?r.reconstruction_mse:Math.max(3.5,12.8-Math.log2(config.steps+1)*.64+config.k*.021+(config.architecture==='batch'?-.75:0));out('training-output',root=>{root.append(create('h3',actual?'Completed training run':'Training simulation'));metrics(root,{'Steps':String(config.steps),'Top K':String(config.k),'Reconstruction MSE':fmt(mse)});
      if(!actual){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 190');svg.style.cssText='width:100%;max-height:210px;margin-top:20px';const poly=document.createElementNS(svg.namespaceURI,'polyline');let pts=[];for(let i=0;i<=28;i++){const frac=i/28;const val=(1-frac)*(1-frac)*.85+.09+Math.sin(i*2.4)*.015;pts.push((12+frac*774)+','+(18+val*152))}poly.setAttribute('points',pts.join(' '));poly.setAttribute('fill','none');poly.setAttribute('stroke','#215b83');poly.setAttribute('stroke-width','2.6');svg.append(poly);root.append(svg);}
      status(root,actual?'WP15 genuine 50-step Sparsify checkpoint was reloaded.':'Simulated training response for the selected parameters. No model was trained in the browser.',!actual)});
    }catch(e){out('training-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('training-run').addEventListener('click',runTraining);$('training-reset').addEventListener('click',()=>{$('train-architecture').value='topk';$('train-k').value='32';$('train-steps').value='50';runTraining()});
  let explanationRecord=null;
  async function runInterpret(){try{explanationRecord??=await fetchRecord('explanation');const feature=Number($('interpret-feature').value),set=$('interpret-set').value;out('interpret-output',root=>{root.append(create('h3','Feature '+feature));
      if(feature===1680){metrics(root,{'Held-out score':fmt(explanationRecord.heldout_score??.5),'Positive examples':String(explanationRecord.heldout_n_positive??3),'Negative examples':String(explanationRecord.heldout_n_negative??1)});paragraph(root,'No approved interpretation.');status(root,'Observed WP15 held-out diagnostic; no semantic conclusion.',false)}
      else{const hypothesis=feature===1819?'May respond to repeated objects and scene descriptions.':'May respond to numeric changes in short technical statements.';paragraph(root,'Candidate: '+hypothesis);const confidence=set==='positive'?.78:.42;metrics(root,{'Example score':fmt(confidence),'Evidence':set==='positive'?'Activating':'Non-activating'});status(root,'Illustrative hypothesis and score; not generated or verified by a model.',true)}
    })}catch(e){out('interpret-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('interpret-run').addEventListener('click',runInterpret);$('interpret-feature').addEventListener('change',runInterpret);$('interpret-set').addEventListener('change',runInterpret);
  async function request(path,{method='GET',body,operator=false}={}){if(!apiOrigin)throw Error('Connect your API first.');const headers={'Accept':'application/json'};if(body!==undefined)headers['Content-Type']='application/json';if(operator){const token=$('live-token').value.trim();if(!token)throw Error('Enter the operator token.');headers.Authorization='Bearer '+token}const res=await fetch(apiOrigin+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{}),credentials:'omit',mode:'cors',cache:'no-store'});let payload;try{payload=await res.json()}catch{throw Error('API did not return JSON.')}if(!res.ok)throw Error(typeof payload.detail==='string'?payload.detail:'API error '+res.status);return payload}
  $('api-connect').addEventListener('click',async()=>{try{const uri=new URL($('api-base').value.trim());if(uri.username||uri.password||uri.search||uri.hash||(!['https:'].includes(uri.protocol)&&!(uri.protocol==='http:'&&['localhost','127.0.0.1'].includes(uri.hostname))))throw Error('Use an HTTPS API origin or localhost.');apiOrigin=uri.origin;const data=await request('/api/health');$('api-status').textContent='Connected';$('mode-status').textContent='Example mode + connected API';}catch(e){apiOrigin='';$('api-status').textContent=e.message;$('mode-status').textContent='Example mode · No GPU needed'}});
  $('live-submit').addEventListener('click',async()=>{out('live-output',root=>paragraph(root,'Submitting…'));try{const b={site_id:$('live-site').value.trim(),operation:$('intervene-operation').value,feature_ids:[Number($('intervene-feature').value)],strength:Number($('intervene-strength').value),max_new_tokens:0};if(!Number.isInteger(b.feature_ids[0])||b.feature_ids[0]<0)throw Error('Invalid feature');let prompt=$('live-prompt').value.trim();if(!prompt)throw Error('Enter a prompt');await request('/api/jobs/preflight',{method:'POST',body:{...b,text:prompt}});const input=await request('/api/private/inputs',{method:'POST',body:{text:prompt},operator:true});const uuid=globalThis.crypto?.randomUUID?.()||('request-'+Date.now());const job=await request('/api/private/jobs',{method:'POST',body:{...b,input_ref:input.input_ref,client_key:uuid},operator:true});queuedJob=job.job_id||job.id;out('live-output',root=>paragraph(root,'Job submitted. Select Check result.'));}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  $('live-check').addEventListener('click',async()=>{try{if(!queuedJob)throw Error('Submit a job first.');const state=await request('/api/private/jobs/'+encodeURIComponent(queuedJob),{operator:true});if(state.status==='succeeded'){const result=await request('/api/private/jobs/'+encodeURIComponent(queuedJob)+'/result',{operator:true});out('live-output',root=>{metrics(root,{'Logit change':fmt(result.max_abs_logit_delta),'Baseline token':String(result.baseline_argmax_token_id),'Edited token':String(result.edited_argmax_token_id)});status(root,'Computed by connected GPU worker.',false)})}else out('live-output',root=>paragraph(root,'Job status: '+state.status))}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  function startup(){let mod=new URLSearchParams(location.search).get('module')||'explore';if(!document.querySelector(`[data-pane="${mod}"]`))mod='explore';showModule(mod)}startup();
})();
