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
  const sourceMatches = key => Object.prototype.hasOwnProperty.call(prompts,key);
  const inferredExample = prompt => Object.keys(prompts).find(key => prompts[key]===prompt) || 'custom';
  const inferredGenerationExample = prompt => {const key=inferredExample(prompt);return ['boats','night'].includes(key)?key:'custom'};
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
  let approvedTrace=null;
  const approvedReady=fetch(source+'explore-demo01.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  const operatorReady=()=>Boolean(apiOrigin&&$('live-token').value.trim());
  const siteId=()=>($('live-site').value||'gemma270m:gemma270m_scope_resid:L5').trim();
  async function pollJob(jobId){
    const started=Date.now();
    while(Date.now()-started<180000){
      const state=await request('/api/private/jobs/'+encodeURIComponent(jobId),{operator:true});
      if(state.status==='succeeded')return request('/api/private/jobs/'+encodeURIComponent(jobId)+'/result',{operator:true});
      if(state.status==='failed'||state.status==='cancelled')throw Error('Worker '+state.status+(state.error_code?': '+state.error_code:''));
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    throw Error('The worker has not finished. No result was invented.');
  }
  async function submitPrivate(prompt,spec){
    await request('/api/jobs/preflight',{method:'POST',body:{...spec,text:prompt}});
    const input=await request('/api/private/inputs',{method:'POST',body:{text:prompt},operator:true});
    const raw=globalThis.crypto?.randomUUID?.()||('request-'+Date.now());
    const key=raw.replace(/[^A-Za-z0-9_-]/g,'').slice(0,120);
    const job=await request('/api/private/jobs',{method:'POST',body:{...spec,input_ref:input.input_ref,client_key:key.length>=8?key:('request-'+Date.now())},operator:true});
    return pollJob(job.job_id||job.id);
  }
  function openIntervene(featureId,prompt){$('intervene-feature').value=featureId;$('intervene-prompt').value=prompt;$('intervene-example').value=inferredExample(prompt);showModule('intervene')}
  function tokenBoard(root,tokens,note){
    root.append(create('h3','Token activations'));
    const bar=create('div','','play-tokens'),detail=create('div');root.append(bar,detail);
    const prompt=$('explore-prompt').value.trim();
    function focus(i){lastSelectedToken=i;bar.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i));detail.replaceChildren();const token=tokens[i];detail.append(create('h3','“'+token.text+'”'));const list=create('div','','feature-list');token.features.slice(0,8).forEach(v=>{const b=create('button','Feature '+v.feature_id+' →   '+fmt(v.activation));b.type='button';b.addEventListener('click',()=>openIntervene(v.feature_id,prompt));list.append(b)});detail.append(list);status(detail,note,false)}
    tokens.forEach((token,i)=>{const b=create('button',token.text);b.type='button';b.title='Inspect '+token.text;b.addEventListener('click',()=>focus(i));bar.append(b)});
    focus(Math.min(lastSelectedToken,Math.max(tokens.length-1,0)));
  }
  async function runExplore(){
    const prompt=$('explore-prompt').value.trim();
    try{const approved=approvedTrace||await approvedReady;approvedTrace=approved;if(approved&&prompt===approved.prompt_text){out('explore-output',root=>tokenBoard(root,approved.tokens,'Recorded Gemma activations for the approved prompt.'));return}}catch(err){out('explore-output',root=>paragraph(root,err.message,'play-failure'));return}
    out('explore-output',root=>{
      if(!prompt)throw Error('Enter a prompt.');const words=getWords(prompt).slice(0,64);if(!words.length)throw Error('Enter a prompt.');
      root.append(create('h3','Token activations'));
      const bar=create('div','','play-tokens'),detail=create('div');root.append(bar,detail);
      function focus(i){lastSelectedToken=i;bar.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i));detail.replaceChildren();const w=words[i];detail.append(create('h3',`“${w}”`));const f=[fakeFeature(w,i,1819),fakeFeature(w,i,1627),fakeFeature(w,i,1680)].sort((a,b)=>b.activation-a.activation);
        const list=create('div','','feature-list');f.forEach(v=>{const b=create('button',`Feature ${v.id} →   ${fmt(v.activation)}`);b.type='button';b.addEventListener('click',()=>{$('intervene-feature').value=v.id;$('intervene-prompt').value=prompt;$('intervene-example').value=inferredExample(prompt);showModule('intervene')});list.append(b)});detail.append(list);
        status(detail,'Illustrative feature activations. Replace with live SAE codes.',true);
      }
      words.forEach((w,i)=>{const b=create('button',w);b.type='button';b.title='Inspect '+w;b.addEventListener('click',()=>focus(i));bar.append(b)});focus(Math.min(lastSelectedToken,words.length-1));
    });
  }
  $('explore-example').addEventListener('change',()=>{$('explore-prompt').value=prompts[$('explore-example').value];lastSelectedToken=0;runExplore()});
  $('explore-run').addEventListener('click',async()=>{lastSelectedToken=0;const prompt=$('explore-prompt').value.trim();const approved=approvedTrace||await approvedReady;approvedTrace=approved;if(!operatorReady()||(approved&&prompt===approved.prompt_text)){runExplore();return}try{out('explore-output',root=>root.append(create('p','Running on the connected worker…')));const result=await submitPrivate(prompt,{site_id:siteId(),operation:'inspect',feature_ids:[],strength:0,max_new_tokens:0});out('explore-output',root=>tokenBoard(root,result.tokens,'Computed by the connected worker.'))}catch(err){out('explore-output',root=>paragraph(root,err.message,'play-failure'))}});
  $('explore-reset').addEventListener('click',()=>{$('explore-example').value='boats';$('explore-prompt').value=prompts.boats;lastSelectedToken=0;runExplore()});
  function runIntervene(){out('intervene-output',root=>{
    const key=$('intervene-example').value,op=$('intervene-operation').value,strength=Number($('intervene-strength').value),id=Number($('intervene-feature').value),prompt=$('intervene-prompt').value.trim();
    if(!Number.isInteger(id)||id<0)throw Error('Choose a valid feature.');if(!prompt)throw Error('Enter a prompt.');if(!Number.isFinite(strength)||strength<0||strength>10)throw Error('Strength must be between 0 and 10.');
    const sourceMatch=prompt===prompts.boats&&key==='boats'&&id===1819&&op==='ablate';
    let change=sourceMatch?9.802836:(id%23+12)*0.15*(op==='ablate'?1:op==='scale'?strength/2:op==='clamp'?Math.min(strength,4)/3:strength/3);
    if(op==='scale'&&strength===1)change=0;
    root.append(create('h3',op==='ablate'?'Feature ablation':op==='scale'?'Feature scaling':op==='clamp'?'Feature clamp':'Feature addition'));
    metrics(root,{'Feature':String(id),'Max logit change':fmt(change),'Next token':sourceMatch?'108 → 255999':change<.1?'Unchanged':'May change'});
    const label=sourceMatch?'Recorded ablation result for this feature and prompt.':'Illustrative edit response. Strength and feature are adjustable.';
    status(root,label,!sourceMatch);
  });}
  $('intervene-example').addEventListener('change',()=>{const key=$('intervene-example').value;if(sourceMatches(key)){$('intervene-feature').value=key==='sensor'?'1627':'1819';$('intervene-prompt').value=prompts[key];}runIntervene()});
  $('intervene-run').addEventListener('click',async()=>{const prompt=$('intervene-prompt').value.trim(),op=$('intervene-operation').value,id=Number($('intervene-feature').value);const recorded=prompt===prompts.boats&&$('intervene-example').value==='boats'&&id===1819&&op==='ablate';if(recorded||!operatorReady()){runIntervene();return}try{out('intervene-output',root=>root.append(create('p','Running on the connected worker…')));const result=await submitPrivate(prompt,{site_id:siteId(),operation:op,feature_ids:[id],strength:Number($('intervene-strength').value),max_new_tokens:0});out('intervene-output',root=>{root.append(create('h3',op==='ablate'?'Feature ablation':op==='scale'?'Feature scaling':op==='clamp'?'Feature clamp':'Feature addition'));if(result.feature_active_at_edit_position===false){paragraph(root,result.message);status(root,'The worker measured no logit change because this feature is inactive at the last token.',false);return}metrics(root,{'Feature':String(result.feature_id),'Max logit change':fmt(result.max_abs_logit_delta),'Next token':result.baseline_argmax_token_id+' → '+result.edited_argmax_token_id});status(root,'Computed by the connected worker.',false)})}catch(err){out('intervene-output',root=>paragraph(root,err.message,'play-failure'))}});$('intervene-prompt').addEventListener('input',()=>{$('intervene-example').value=inferredExample($('intervene-prompt').value.trim());});
  for(const k of ['intervene-operation','intervene-strength','intervene-feature'])$(k).addEventListener('change',runIntervene);
  $('intervene-generation').addEventListener('click',()=>{const prompt=$('intervene-prompt').value.trim();$('generate-example').value=inferredGenerationExample(prompt);$('generate-prompt').value=prompt;$('generate-feature').value=$('intervene-feature').value;$('generate-strength').value=$('intervene-strength').value;$('generate-operation').value=$('intervene-operation').value;showModule('generate')});
  function runGenerate(){out('generate-output',root=>{
    const key=$('generate-example').value,operation=$('generate-operation').value,prompt=$('generate-prompt').value.trim(), feature=Number($('generate-feature').value), strength=Number($('generate-strength').value);
    if(!prompt)throw Error('Enter a prompt.');
    if(!Number.isInteger(feature)||feature<0)throw Error('Choose a valid feature.');
    if(!Number.isFinite(strength)||strength<0||strength>10)throw Error('Strength must be between 0 and 10.');
    const match=sourceMatches(key)&&prompt===prompts[key];
    const measured=match&&feature===1819&&operation==='ablate'&&(key==='boats'||key==='night');
    const clean=match&&baseline[key]!==undefined?baseline[key]:`\n\n${prompt.split(/\s+/).slice(-8).join(' ')} The description continues in a similar way.`;
    const edited=operation==='noop'?clean:measured?after[key]:
      `${clean.slice(0,90)}\n[Feature ${feature} ${operation} at strength ${strength}: illustrative change]`;
    root.append(create('h3','Generated continuation'));
    comparison(root,'Baseline',clean,operation==='noop'?'No change':operation==='scale'?'Scale':operation==='clamp'?'Clamp':operation==='add'?'Add':'After ablation',edited);
    let delta=0;
    if(measured)delta=key==='boats'?9.802836:7.65;
    else if(operation!=='noop')delta=(seed(`${prompt}:${feature}:${operation}`)%1000)/100*(operation==='ablate'?1:Math.abs(strength-(operation==='scale'?1:0))/2);
    const changed=operation==='noop'?false:measured?key==='boats':delta>=.1;
    metrics(root,{'Feature':String(feature),'First-token change':changed?'Yes':'No','Maximum logit change':fmt(delta)});
    status(root,measured?'Recorded continuation and measured first-step logit change.':'Illustrative output for the selected prompt, feature and operation. No model ran.',!measured);
  });}
  $('generate-example').addEventListener('change',()=>{const key=$('generate-example').value;if(sourceMatches(key))$('generate-prompt').value=prompts[key];runGenerate()});
  $('generate-prompt').addEventListener('input',()=>{$('generate-example').value=inferredGenerationExample($('generate-prompt').value.trim());});
  for(const id of ['generate-operation','generate-feature','generate-strength'])$(id).addEventListener('change',runGenerate);
  $('generate-run').addEventListener('click',async()=>{const key=$('generate-example').value,operation=$('generate-operation').value,prompt=$('generate-prompt').value.trim(),feature=Number($('generate-feature').value);const measured=sourceMatches(key)&&prompt===prompts[key]&&feature===1819&&operation==='ablate'&&(key==='boats'||key==='night');if(measured||!operatorReady()){runGenerate();return}if(operation==='clamp'||operation==='add'){out('generate-output',root=>paragraph(root,'The worker generates with no change, ablation, or scaling. Clamp and add stay illustrative until you disconnect the API.','play-failure'));return}try{const spec=operation==='noop'?{site_id:siteId(),operation:'identity',feature_ids:[],strength:0,max_new_tokens:16}:{site_id:siteId(),operation,feature_ids:[feature],strength:operation==='scale'?Number($('generate-strength').value):0,max_new_tokens:16};out('generate-output',root=>root.append(create('p','Running on the connected worker…')));const result=await submitPrivate(prompt,spec);out('generate-output',root=>{root.append(create('h3','Generated continuation'));comparison(root,'Baseline',result.baseline_continuation,operation==='scale'?'Scale':'After edit',result.edited_continuation);const step=result.steps&&result.steps[0];metrics(root,{'Feature':String(result.feature_id??feature),'First-token change':result.same_continuation?'No':'Yes','Maximum logit change':step?fmt(step.max_abs_logit_delta):'—'});status(root,'Computed by the connected worker.',false)})}catch(err){out('generate-output',root=>paragraph(root,err.message,'play-failure'))}});
  async function fetchRecord(name){let r=await fetch(source+name+'.json',{cache:'no-store'});if(!r.ok)throw Error('Could not load '+name+' data.');return r.json()}
  let circuitLoading=null;
  async function runCircuit(){
    try{if(!circuit){circuitLoading??=fetchRecord('circuit');circuit=await circuitLoading;}const graph=circuit.graph||{};const nodes=graph.nodes||[],allEdges=graph.edges||[],minimum=Number($('circuit-weight').value);$('weight-label').textContent=String(minimum);
      const edges=allEdges.filter(x=>Math.abs(x.weight||0)>=minimum);$('circuit-run').disabled=minimum===0;$('circuit-complete').hidden=minimum!==0;out('circuit-summary',root=>{metrics(root,{'Model':circuit.model||'Gemma 2 · 2B','Nodes':String(nodes.length),'Visible edges':String(edges.length)});status(root,'Native Circuit Tracer graph, filtered by edge weight.',false)});
      const svg=$('play-circuit');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';const coords=new Map();const layers=[...new Set(nodes.map(n=>Number.isInteger(n.layer)?n.layer:-1))].sort((a,b)=>a-b);const buckets=new Map(layers.map(l=>[l,nodes.filter(n=>(Number.isInteger(n.layer)?n.layer:-1)===l)]));
      for(const [li,layer] of layers.entries()){const row=buckets.get(layer);row.forEach((n,i)=>coords.set(n.id,{x:35+li*930/Math.max(1,layers.length-1),y:12+(i+1)*490/(row.length+1)}))}
      function sv(tag,attrs){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el}
      for(const e of edges){const a=coords.get(e.source),b=coords.get(e.target);if(a&&b)sv('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:e.weight<0?'#9b7f76':'#91a2b8','stroke-width':Math.min(2,0.5+Math.abs(e.weight)/24),opacity:'.48'})}
      for(const n of nodes){const xy=coords.get(n.id);if(!xy)continue;const circle=sv('circle',{cx:xy.x,cy:xy.y,r:n.kind==='logit'?6:n.kind==='error'?5:3.7,fill:n.kind==='error'?'#925750':'#215b83',tabindex:'0',role:'button','aria-label':'Open node '+n.id});const open=()=>out('circuit-detail',root=>{metrics(root,{'Node':n.id,'Type':n.kind||'feature', 'Layer':Number.isInteger(n.layer)?String(n.layer):'—'});if(n.label)paragraph(root,n.label)});circle.addEventListener('click',open);circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})}
    }catch(e){out('circuit-summary',root=>paragraph(root,e.message,'play-failure'))}
  }
  $('circuit-run').addEventListener('click',()=>{$('circuit-weight').value='0';runCircuit()});$('circuit-weight').addEventListener('input',runCircuit);
  let benchmarkRecord=null;
  async function runBenchmark(){try{benchmarkRecord??=await fetchRecord('benchmark');const m=benchmarkRecord.metrics||{};const key=$('benchmark-metric').value;const entries={l0:['Active features (L0)',m['saebench.core.l0'],'features'],mse:['Reconstruction MSE',m['saebench.core.mse'],''],probe:['Sparse probing accuracy',m['saebench.sparse_probing.sae_top_1_test_accuracy'],'%']};const [label,value,suffix]=entries[key];out('benchmark-output',root=>{root.append(create('h3',label));metrics(root,{[label]:suffix==='%'?fmt(value*100)+'%':fmt(value),'Model':benchmarkRecord.model_name||'Pythia 70M','SAE':benchmarkRecord.sae_id||'Layer 3'});status(root,'Original SAEBench result. Selecting a metric does not rerun evaluation.',false)});}catch(e){out('benchmark-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('benchmark-metric').addEventListener('change',runBenchmark);
  let trainingRecord=null;
  async function runTraining(){try{trainingRecord??=await fetchRecord('training');const r=trainingRecord;const config={architecture:$('train-architecture').value,k:Number($('train-k').value),steps:Number($('train-steps').value)};const actual=config.architecture==='topk'&&config.k===32&&config.steps===50;const mse=actual?r.reconstruction_mse:Math.max(3.5,12.8-Math.log2(config.steps+1)*.64+config.k*.021+(config.architecture==='batch'?-.75:0));out('training-output',root=>{root.append(create('h3',actual?'Completed training run':'Training simulation'));metrics(root,{'Steps':String(config.steps),'Top K':String(config.k),'Reconstruction MSE':fmt(mse)});
      if(!actual){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 190');svg.style.cssText='width:100%;max-height:210px;margin-top:20px';const poly=document.createElementNS(svg.namespaceURI,'polyline');let pts=[];for(let i=0;i<=28;i++){const frac=i/28;const val=(1-frac)*(1-frac)*.85+.09+Math.sin(i*2.4)*.015;pts.push((12+frac*774)+','+(18+val*152))}poly.setAttribute('points',pts.join(' '));poly.setAttribute('fill','none');poly.setAttribute('stroke','#215b83');poly.setAttribute('stroke-width','2.6');svg.append(poly);root.append(svg);}
      status(root,actual?'Recorded 50-step training result from a saved checkpoint.':'Simulated training response for the selected parameters. No model was trained in the browser.',!actual)});
    }catch(e){out('training-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('training-run').addEventListener('click',runTraining);for(const id of ['train-architecture','train-k','train-steps'])$(id).addEventListener('change',runTraining);$('training-reset').addEventListener('click',()=>{$('train-architecture').value='topk';$('train-k').value='32';$('train-steps').value='50';runTraining()});
  let explanationRecord=null;
  async function runInterpret(){try{explanationRecord??=await fetchRecord('explanation');const feature=Number($('interpret-feature').value),set=$('interpret-set').value;out('interpret-output',root=>{root.append(create('h3','Feature '+feature));
      if(feature===1680){const positive=set==='positive';metrics(root,{'Held-out score (all examples)':fmt(explanationRecord.heldout_score??.5),[positive?'Positive examples':'Negative examples']:String(positive?(explanationRecord.heldout_n_positive??3):(explanationRecord.heldout_n_negative??1))});paragraph(root,positive?'The candidate was evaluated on activating examples.':'The candidate was also evaluated on non-activating examples.');paragraph(root,'No approved interpretation.');status(root,'Recorded held-out diagnostic. The score is aggregate, not per group.',false)}
      else{const hypothesis=feature===1819?'May respond to repeated objects and scene descriptions.':'May respond to numeric changes in short technical statements.';paragraph(root,'Candidate: '+hypothesis);const confidence=set==='positive'?.78:.42;metrics(root,{'Example score':fmt(confidence),'Evidence':set==='positive'?'Activating':'Non-activating'});status(root,'Illustrative hypothesis and score; not generated or verified by a model.',true)}
    })}catch(e){out('interpret-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('interpret-run').addEventListener('click',runInterpret);$('interpret-feature').addEventListener('change',runInterpret);$('interpret-set').addEventListener('change',runInterpret);
  async function request(path,{method='GET',body,operator=false}={}){if(!apiOrigin)throw Error('Connect your API first.');const headers={'Accept':'application/json'};if(body!==undefined)headers['Content-Type']='application/json';if(operator){const token=$('live-token').value.trim();if(!token)throw Error('Enter the operator token.');headers.Authorization='Bearer '+token}const res=await fetch(apiOrigin+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{}),credentials:'omit',mode:'cors',cache:'no-store'});let payload;try{payload=await res.json()}catch{throw Error('API did not return JSON.')}if(!res.ok)throw Error(typeof payload.detail==='string'?payload.detail:'API error '+res.status);return payload}
  // Reuse the current intervention instead of asking the operator to re-enter the prompt.
  document.querySelector('.live-compute')?.addEventListener('toggle',event=>{if(event.target.open)$('live-prompt').value=$('intervene-prompt').value;});
  $('api-connect').addEventListener('click',async()=>{try{const uri=new URL($('api-base').value.trim());if(uri.username||uri.password||uri.search||uri.hash||(!['https:'].includes(uri.protocol)&&!(uri.protocol==='http:'&&['localhost','127.0.0.1'].includes(uri.hostname))))throw Error('Use an HTTPS API origin or localhost.');apiOrigin=uri.origin;const data=await request('/api/health');$('api-status').textContent='Connected';$('mode-status').textContent='Demo test · Connected API';$('public-api-note').hidden=true;document.querySelector('.live-compute').hidden=false;}catch(e){apiOrigin='';$('api-status').textContent=e.message;$('mode-status').textContent='Demo test · API in building';$('public-api-note').hidden=false;document.querySelector('.live-compute').hidden=true;}});
  $('live-submit').addEventListener('click',async()=>{queuedJob='';$('live-check').disabled=true;$('check-hint').hidden=false;out('live-output',root=>paragraph(root,'Submitting…'));try{const b={site_id:$('live-site').value.trim(),operation:$('intervene-operation').value,feature_ids:[Number($('intervene-feature').value)],strength:Number($('intervene-strength').value),max_new_tokens:0};if(!Number.isInteger(b.feature_ids[0])||b.feature_ids[0]<0)throw Error('Invalid feature');let prompt=$('live-prompt').value.trim();if(!prompt)throw Error('Enter a prompt');await request('/api/jobs/preflight',{method:'POST',body:{...b,text:prompt}});const input=await request('/api/private/inputs',{method:'POST',body:{text:prompt},operator:true});const uuid=globalThis.crypto?.randomUUID?.()||('request-'+Date.now());const job=await request('/api/private/jobs',{method:'POST',body:{...b,input_ref:input.input_ref,client_key:uuid},operator:true});queuedJob=job.job_id||job.id;if(!queuedJob)throw Error('No job ID returned.');$('live-check').disabled=false;$('check-hint').hidden=true;out('live-output',root=>paragraph(root,'Job submitted. Select Check result.'));}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  $('live-check').addEventListener('click',async()=>{try{if(!queuedJob)throw Error('Submit a job first.');const state=await request('/api/private/jobs/'+encodeURIComponent(queuedJob),{operator:true});if(state.status==='succeeded'){const result=await request('/api/private/jobs/'+encodeURIComponent(queuedJob)+'/result',{operator:true});out('live-output',root=>{metrics(root,{'Logit change':fmt(result.max_abs_logit_delta),'Baseline token':String(result.baseline_argmax_token_id),'Edited token':String(result.edited_argmax_token_id)});status(root,'Computed by connected GPU worker.',false)})}else out('live-output',root=>paragraph(root,'Job status: '+state.status))}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  function startup(){let mod=new URLSearchParams(location.search).get('module')||'explore';if(!document.querySelector(`[data-pane="${mod}"]`))mod='explore';showModule(mod)}startup();
})();
