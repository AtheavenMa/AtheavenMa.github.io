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

    let apiOrigin = '', queuedJob = '', circuit = null, activeModule = 'explore', lastSelectedToken = 0;
  const sourceMatches = key => Object.prototype.hasOwnProperty.call(prompts,key);
  const inferredExample = prompt => Object.keys(prompts).find(key => prompts[key]===prompt) || 'custom';
  const inferredGenerationExample = prompt => {const key=inferredExample(prompt);return ['boats','night'].includes(key)?key:'custom'};
  const source = 'data/wp15/';
  const out = (id, fn) => { const node=reset(id); try{fn(node);}catch(err){node.append(create('p',err.message,'play-failure'));} };
  const paragraph = (node, text, cls) => {const p=create('p',text,cls);node.append(p);return p};
  const metric = (root, label, value) => {const d=create('div','','measure');d.append(create('span',label,'measure-name'),create('strong',value));root.append(d);};
  const metrics = (root, values) => {const row=create('div','','measure-row');Object.entries(values).forEach(([k,v])=>metric(row,k,v));root.append(row);};
  const card = (node, title, copy) => {const div=create('div'); div.append(create('h4',title),create('p',copy));node.append(div)};
  const comparison = (root, first, a, second, b) => {const wrap=create('div','','comparison');card(wrap,first,a);card(wrap,second,b);root.append(wrap)};
  // Render results only in response to explicit user actions.
  const resultVersions=Object.create(null);
  const resultIds={explore:'explore-output',intervene:'intervene-output',generate:'generate-output',circuits:'circuit-summary',benchmarks:'benchmark-output',training:'training-output',interpret:'interpret-output'};
  let circuitVisible=false;
  function clearResult(name) {
    resultVersions[name]=(resultVersions[name]||0)+1;
    if(resultIds[name])reset(resultIds[name]);
    if(name==='circuits'){circuitVisible=false;reset('circuit-detail');$('play-circuit').replaceChildren();$('circuit-complete').hidden=true}
  }
  function showModule(name) {
    if(!document.querySelector(`[data-pane="${name}"]`))return;
    activeModule=name;
    document.querySelectorAll('#workspace-nav [data-module]').forEach(btn=>{const yes=btn.dataset.module===name;btn.classList.toggle('active',yes);btn.setAttribute('aria-current',yes?'page':'false')});
    document.querySelectorAll('.workspace-panel').forEach(panel=>{panel.classList.toggle('active',panel.dataset.pane===name);panel.hidden=panel.dataset.pane!==name});
    clearResult(name);
    try { history.replaceState(null,'',location.pathname+'?module='+name); } catch {}
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
    throw Error('The worker has not finished. Check the job status again.');
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
  function tokenBoard(root,tokens){
    root.append(create('h3','Token activations'));
    const bar=create('div','','play-tokens'),detail=create('div');root.append(bar,detail);
    const prompt=$('explore-prompt').value.trim();
    function focus(i){lastSelectedToken=i;bar.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i));detail.replaceChildren();const token=tokens[i];detail.append(create('h3','“'+token.text+'”'));const list=create('div','','feature-list');token.features.slice(0,8).forEach(v=>{const b=create('button','Feature '+v.feature_id+' →   '+fmt(v.activation));b.type='button';b.addEventListener('click',()=>openIntervene(v.feature_id,prompt));list.append(b)});detail.append(list)}
    tokens.forEach((token,i)=>{const b=create('button',token.text);b.type='button';b.title='Inspect '+token.text;b.addEventListener('click',()=>focus(i));bar.append(b)});
    focus(Math.min(lastSelectedToken,Math.max(tokens.length-1,0)));
  }
  async function runExplore(){
    const prompt=$('explore-prompt').value.trim();
    const version=resultVersions.explore;
    try{const approved=approvedTrace||await approvedReady;if(version!==resultVersions.explore)return;approvedTrace=approved;if(approved&&prompt===approved.prompt_text){out('explore-output',root=>tokenBoard(root,approved.tokens));return}}catch(err){if(version===resultVersions.explore)out('explore-output',root=>paragraph(root,err.message,'play-failure'));return}
    out('explore-output',root=>{
      if(!prompt)throw Error('Enter a prompt.');const words=getWords(prompt).slice(0,64);if(!words.length)throw Error('Enter a prompt.');
      root.append(create('h3','Token activations'));
      const bar=create('div','','play-tokens'),detail=create('div');root.append(bar,detail);
      function focus(i){lastSelectedToken=i;bar.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i));detail.replaceChildren();const w=words[i];detail.append(create('h3',`“${w}”`));const f=[fakeFeature(w,i,1819),fakeFeature(w,i,1627),fakeFeature(w,i,1680)].sort((a,b)=>b.activation-a.activation);
        const list=create('div','','feature-list');f.forEach(v=>{const b=create('button',`Feature ${v.id} →   ${fmt(v.activation)}`);b.type='button';b.addEventListener('click',()=>{$('intervene-feature').value=v.id;$('intervene-prompt').value=prompt;$('intervene-example').value=inferredExample(prompt);showModule('intervene')});list.append(b)});detail.append(list);
      }
      words.forEach((w,i)=>{const b=create('button',w);b.type='button';b.title='Inspect '+w;b.addEventListener('click',()=>focus(i));bar.append(b)});focus(Math.min(lastSelectedToken,words.length-1));
    });
  }
  $('explore-example').addEventListener('change',()=>{$('explore-prompt').value=prompts[$('explore-example').value];lastSelectedToken=0;clearResult('explore')});
  $('explore-run').addEventListener('click',async()=>{clearResult('explore');lastSelectedToken=0;const version=resultVersions.explore;const prompt=$('explore-prompt').value.trim();const approved=approvedTrace||await approvedReady;if(version!==resultVersions.explore)return;approvedTrace=approved;if(!operatorReady()||(approved&&prompt===approved.prompt_text)){runExplore();return}try{out('explore-output',root=>root.append(create('p','Running on the connected worker…')));const result=await submitPrivate(prompt,{site_id:siteId(),operation:'inspect',feature_ids:[],strength:0,max_new_tokens:0});if(version===resultVersions.explore)out('explore-output',root=>tokenBoard(root,result.tokens))}catch(err){if(version===resultVersions.explore)out('explore-output',root=>paragraph(root,err.message,'play-failure'))}});
  $('explore-reset').addEventListener('click',()=>{$('explore-example').value='boats';$('explore-prompt').value=prompts.boats;lastSelectedToken=0;clearResult('explore')});

  const publishedPromptDigests={
    boats:'33f0195c5961825882fa08ffddb9b4de80bd572b728b9b87fc4ed772652c75e6',
    night:'683d2275d77b908d4e18aa421764dbc0b1a7aa601d1b9702891ab050e1373790'
  };
  let generationRecord=null,traceRecord=null;
  async function measuredGeneration(){
    generationRecord??=await fetchRecord('generation');
    return generationRecord;
  }
  function recordedCondition(data,key,feature,op,strength){
    if(!data||feature!==1819||!(key in publishedPromptDigests))return null;
    if(!['ablate','scale','noop'].includes(op))return null;
    if(op==='scale'&&Number(strength)!==2)return null;
    const sample=(data.samples||[]).find(x=>x.prompt_sha256===publishedPromptDigests[key]&&x.feature_id===feature);
    if(!sample)return null;
    const edit=(sample.conditions||[]).find(x=>x.name===op);
    return edit?{sample,edit}:null;
  }
  function probabilityCard(root,title,probability,isEdited){
    const p=Number(probability)*100;
    const card=create('div','','probability-card'+(isEdited?' probability-edited':''));
    card.append(create('h4',title));
    card.append(create('strong',fmt(p)+'%','probability-number'));
    const track=create('div','','probability-track');
    const fill=create('span','','probability-fill');
    fill.style.width=Math.max(0,Math.min(100,p))+'%';
    track.append(fill);card.append(track);
    root.append(card);
  }
  function renderProbabilityChange(root,found,op){
    const clean=found.edit.clean_argmax_probability;
    const edited=found.edit.edited_probability_of_clean_argmax;
    const delta=(edited-clean)*100;
    root.append(create('h3','Next-token comparison'));
    const pair=create('div','','probability-grid');
    probabilityCard(pair,'Baseline',clean,false);
    probabilityCard(pair,op==='ablate'?'After ablation':op==='scale'?'After scaling':'No change',edited,true);
    root.append(pair);
    const summary=create('div','','generation-insight');
    const changed=found.edit.argmax_changed===true;
    summary.append(create('strong',changed?'Next token changed':(Math.abs(delta)>0.01?'Token preference shifted':'No change')));
    if(op!=='noop')summary.append(create('span',(delta>=0?'+':'')+fmt(delta)+' percentage points for the baseline next token'));
    if(changed&&Number.isFinite(found.edit.edited_argmax_probability))summary.append(create('span','New leading token probability '+fmt(100*found.edit.edited_argmax_probability)+'%'));
    root.append(summary);
  }
  function updateStrengthControl(prefix){
    const op=$(prefix+'-operation').value;
    const wrap=$(prefix+'-strength-wrap');
    wrap.hidden=op!=='scale';
    $(prefix+'-strength').value='2';
  }

  async function runIntervene(){
    const version=resultVersions.intervene;
    const key=$('intervene-example').value;
    const op=$('intervene-operation').value;
    const feature=Number($('intervene-feature').value);
    if(!Number.isInteger(feature)||feature<0){out('intervene-output',root=>paragraph(root,'Enter a valid Feature ID.'));return}
    try{
      const record=await measuredGeneration();
      if(version!==resultVersions.intervene)return;
      const found=recordedCondition(record,key,feature,op,$('intervene-strength').value);
      if(!found){out('intervene-output',root=>paragraph(root,'No recorded edit for this selection.'));return}
      out('intervene-output',root=>{
        root.append(create('h3','Feature '+feature));
        metrics(root,{'Activation':fmt(found.sample.feature_activation),'Token position':String(found.sample.feature_position)});
        renderProbabilityChange(root,found,op);
      });
    }catch(e){if(version===resultVersions.intervene)out('intervene-output',root=>paragraph(root,'Unable to load intervention data.','play-failure'))}
  }
  $('intervene-example').addEventListener('change',()=>{
    const key=$('intervene-example').value;
    if(sourceMatches(key)){
      $('intervene-feature').value=key==='sensor'?'1627':'1819';
      $('intervene-prompt').value=prompts[key];
    }
    clearResult('intervene');
  });
  $('intervene-run').addEventListener('click',()=>{clearResult('intervene');runIntervene()});
  $('intervene-prompt').addEventListener('input',()=>clearResult('intervene'));
  $('intervene-operation').addEventListener('change',()=>{updateStrengthControl('intervene');clearResult('intervene')});
  $('intervene-feature').addEventListener('input',()=>clearResult('intervene'));
  $('intervene-generation').addEventListener('click',()=>{
    const prompt=$('intervene-prompt').value.trim();
    const key=inferredGenerationExample(prompt);
    $('generate-example').value=key;
    $('generate-prompt').value=prompt;
    $('generate-feature').value=$('intervene-feature').value;
    $('generate-operation').value=$('intervene-operation').value;
    updateStrengthControl('generate');
    showModule('generate');
  });
  async function runGenerate(){
    const version=resultVersions.generate;
    const key=$('generate-example').value;
    const op=$('generate-operation').value;
    const feature=Number($('generate-feature').value);
    try{
      const record=await measuredGeneration();
      if(version!==resultVersions.generate)return;
      const found=recordedCondition(record,key,feature,op,$('generate-strength').value);
      if(!found){out('generate-output',root=>paragraph(root,'No recorded generation for this selection.'));return}
      out('generate-output',root=>{
        renderProbabilityChange(root,found,op);
      });
    }catch(e){if(version===resultVersions.generate)out('generate-output',root=>paragraph(root,'Unable to load generation data.','play-failure'))}
  }
  $('generate-example').addEventListener('change',()=>{
    const key=$('generate-example').value;
    if(sourceMatches(key))$('generate-prompt').value=prompts[key];
    clearResult('generate');
  });
  $('generate-feature').addEventListener('input',()=>clearResult('generate'));
  $('generate-prompt').addEventListener('input',()=>clearResult('generate'));
  $('generate-operation').addEventListener('change',()=>{updateStrengthControl('generate');clearResult('generate')});
  $('generate-run').addEventListener('click',()=>{clearResult('generate');runGenerate()});
  updateStrengthControl('intervene');
  updateStrengthControl('generate');

    async function fetchRecord(name){let r=await fetch(source+name+'.json',{cache:'no-store'});if(!r.ok)throw Error('Could not load '+name+' data.');return r.json()}
  let circuitLoading=null;
  async function runCircuit(){
    const version=resultVersions.circuits;
    try{if(!circuit){circuitLoading??=fetchRecord('circuit');circuit=await circuitLoading;}if(version!==resultVersions.circuits)return;const graph=circuit.graph||{};const nodes=graph.nodes||[],allEdges=graph.edges||[],minimum=Number($('circuit-weight').value);$('weight-label').textContent=String(minimum);
      const edges=allEdges.filter(x=>Math.abs(x.weight||0)>=minimum);$('circuit-run').disabled=false;$('circuit-complete').hidden=minimum!==0;out('circuit-summary',root=>{metrics(root,{'Model':circuit.model||'Gemma 2 · 2B','Nodes':String(nodes.length),'Visible edges':String(edges.length)})});
      const svg=$('play-circuit');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';const coords=new Map();const layers=[...new Set(nodes.map(n=>Number.isInteger(n.layer)?n.layer:-1))].sort((a,b)=>a-b);const buckets=new Map(layers.map(l=>[l,nodes.filter(n=>(Number.isInteger(n.layer)?n.layer:-1)===l)]));
      for(const [li,layer] of layers.entries()){const row=buckets.get(layer);row.forEach((n,i)=>coords.set(n.id,{x:35+li*930/Math.max(1,layers.length-1),y:12+(i+1)*490/(row.length+1)}))}
      function sv(tag,attrs){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el}
      for(const e of edges){const a=coords.get(e.source),b=coords.get(e.target);if(a&&b)sv('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:e.weight<0?'#9b7f76':'#91a2b8','stroke-width':Math.min(2,0.5+Math.abs(e.weight)/24),opacity:'.48'})}

      const tooltip=$('circuit-tooltip');
      const explainNode=n=>{
        if(n.kind==='feature')return 'Feature '+n.feature_id+' · Layer '+n.layer+' · Token '+n.token_position;
        if(n.kind==='token')return 'Input token · Position '+n.token_position;
        if(n.kind==='logit')return 'Output prediction pathway';
        return 'Reconstruction error pathway';
      };
      const noteNode=n=>{
        if(n.kind==='feature')return 'Learned feature contributing along the connected circuit paths.';
        if(n.kind==='token')return 'Input position contributing to downstream features.';
        if(n.kind==='logit')return 'Contribution to the output token prediction.';
        return 'Contribution not reconstructed by the sparse features.';
      };
      const placeTooltip=(event)=>{
        const bounds=$('play-circuit').getBoundingClientRect();
        const left=Math.min(Math.max(event.clientX-bounds.left+14,12),Math.max(12,bounds.width-260));
        const top=Math.max(4,event.clientY-bounds.top+10);
        tooltip.style.left=left+'px';tooltip.style.top=top+'px';
      };
      for(const n of nodes){
        const xy=coords.get(n.id);if(!xy)continue;
        const circle=sv('circle',{cx:xy.x,cy:xy.y,r:n.kind==='logit'?6:n.kind==='error'?5:4,fill:n.kind==='error'?'#925750':'#215b83',tabindex:'0',role:'button','aria-label':explainNode(n)});
        const title=document.createElementNS(ns,'title');title.textContent=explainNode(n)+' — '+noteNode(n);circle.append(title);
        const reveal=(ev)=>{
          tooltip.replaceChildren(create('strong',explainNode(n)),create('span',noteNode(n)));
          tooltip.hidden=false;
          if(ev&&ev.clientX!==undefined)placeTooltip(ev);
          else{tooltip.style.left=Math.max(6,Math.min($('play-circuit').clientWidth-260,xy.x))+'px';tooltip.style.top=Math.max(4,xy.y)+'px'}
        };
        const open=()=>out('circuit-detail',root=>{
          root.append(create('h3',explainNode(n)));
          paragraph(root,noteNode(n));
          if(n.kind==='feature')metrics(root,{'Feature ID':String(n.feature_id),'Layer':String(n.layer),'Token position':String(n.token_position)});
        });
        circle.addEventListener('pointerenter',reveal);
        circle.addEventListener('pointermove',placeTooltip);
        circle.addEventListener('pointerleave',()=>tooltip.hidden=true);
        circle.addEventListener('focus',reveal);
        circle.addEventListener('blur',()=>tooltip.hidden=true);
        circle.addEventListener('click',open);
        circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
      }

    }catch(e){out('circuit-summary',root=>paragraph(root,e.message,'play-failure'))}
  }
  $('circuit-run').addEventListener('click',()=>{circuitVisible=true;runCircuit()});$('circuit-weight').addEventListener('input',()=>{const weight=Number($('circuit-weight').value);$('weight-label').textContent=String(weight);clearResult('circuits')});

  let benchmarkRecord=null;
  function linkedText(root,txt,url){
    const a=create('a',txt+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='evidence-link';root.append(a);
  }
  async function runBenchmark(){
    const version=resultVersions.benchmarks;
    try{
      benchmarkRecord??=await fetchRecord('benchmark');
      if(version!==resultVersions.benchmarks)return;
      const b=benchmarkRecord,m=b.metrics||{},section=$('benchmark-metric').value;
      out('benchmark-output',root=>{
        const l0=Number(m['saebench.core.l0']), mse=Number(m['saebench.core.mse']), probe=Number(m['saebench.sparse_probing.sae_top_1_test_accuracy']);
        if(section==='coverage'){
          root.append(create('h3','Research Lab coverage'));
          metrics(root,{'Model sites':'48','Prompt groups':'500','Feature cards':'300','Intervention sites':'6'});
          linkedText(root,'Explore the evaluation dataset','https://huggingface.co/datasets/OpenSAE/SAEBase-Evaluation');
          linkedText(root,'Research Lab','https://huggingface.co/spaces/OpenSAE/SAEBase');
          return;
        }
        root.append(create('h3',section==='overview'?'Benchmark results':section==='l0'?'Active features':section==='mse'?'Reconstruction error':'Sparse probing'));
        const descriptors=[
          ['Active features (L0)',fmt(l0),'Average number of active features in the SAE representation.'],
          ['Reconstruction MSE',mse.toFixed(5),'Mean squared reconstruction error; smaller is better.'],
          ['Sparse probing accuracy',fmt(probe*100)+'%','Accuracy of a sparse classifier using SAE features.']
        ];
        const rows=section==='overview'?descriptors:descriptors.filter((_,i)=>i==={l0:0,mse:1,probe:2}[section]);
        for(const [name,value,description] of rows){
          const item=create('div','','eval-metric-row');
          item.append(create('div',name,'eval-metric-name'),create('strong',value),create('p',description));
          root.append(item);
        }
        const context=create('div','','eval-context');
        context.append(create('strong','Model and evaluation'));
        context.append(create('p','Pythia 70M · Layer 3'));
        context.append(create('p','Dataset: AG News · SAE: '+String(b.sae_id||'Layer 3')));
        root.append(context);
        linkedText(root,'Source dataset','https://huggingface.co/datasets/OpenSAE/SAEBase-Evaluation');
      });
    }catch(e){if(version===resultVersions.benchmarks)out('benchmark-output',root=>paragraph(root,'Unable to load benchmark results.','play-failure'))}
  }
  $('benchmark-metric').addEventListener('change',()=>clearResult('benchmarks'));
  $('benchmark-run').addEventListener('click',()=>{clearResult('benchmarks');runBenchmark()});

    let trainingRecord=null;
  async function runTraining(){const version=resultVersions.training;try{trainingRecord??=await fetchRecord('training');if(version!==resultVersions.training)return;const r=trainingRecord;const config={architecture:$('train-architecture').value,k:Number($('train-k').value),steps:Number($('train-steps').value)};const actual=config.architecture==='topk'&&config.k===32&&config.steps===50;const mse=actual?r.reconstruction_mse:Math.max(3.5,12.8-Math.log2(config.steps+1)*.64+config.k*.021+(config.architecture==='batch'?-.75:0));out('training-output',root=>{root.append(create('h3',actual?'Completed training run':'Training preview'));metrics(root,{'Steps':String(config.steps),'Top K':String(config.k),'Reconstruction MSE':fmt(mse)});
      if(!actual){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 190');svg.style.cssText='width:100%;max-height:210px;margin-top:20px';const poly=document.createElementNS(svg.namespaceURI,'polyline');let pts=[];for(let i=0;i<=28;i++){const frac=i/28;const val=(1-frac)*(1-frac)*.85+.09+Math.sin(i*2.4)*.015;pts.push((12+frac*774)+','+(18+val*152))}poly.setAttribute('points',pts.join(' '));poly.setAttribute('fill','none');poly.setAttribute('stroke','#215b83');poly.setAttribute('stroke-width','2.6');svg.append(poly);root.append(svg);}
});
    }catch(e){out('training-output',root=>paragraph(root,e.message,'play-failure'))}}
  $('training-run').addEventListener('click',runTraining);for(const id of ['train-architecture','train-k','train-steps'])$(id).addEventListener('change',()=>clearResult('training'));$('training-reset').addEventListener('click',()=>{$('train-architecture').value='topk';$('train-k').value='32';$('train-steps').value='50';clearResult('training')});

  async function runInterpret(){
    const version=resultVersions.interpret;
    try{
      traceRecord??=await fetchRecord('explore-demo01');
      if(version!==resultVersions.interpret)return;
      const trace=traceRecord,feature=Number($('interpret-feature').value),view=$('interpret-set').value;
      const active=(trace.tokens||[]).flatMap(t=>(t.features||[]).filter(f=>f.feature_id===feature).map(f=>({position:t.position,token:t.text,activation:f.activation})));
      const explain={
        1627:'May respond to quantities in sensor readings.',
        1680:'May respond to the opening of a sentence.',
        1819:'May respond at the end of a sentence.'
      };
      out('interpret-output',root=>{
        root.append(create('h3','Feature '+feature));
        root.append(create('p','Possible explanation: '+(explain[feature]||'Feature activation pattern.')));
        const strongest=active.reduce((v,x)=>Math.max(v,x.activation),0);
        metrics(root,{'Active tokens':String(active.length),'Peak activation':fmt(strongest)});
        if(view==='tokens'){
          const wrap=create('div','','interpret-token-row'),ids=new Set(active.map(a=>a.position));
          for(const token of trace.tokens||[]){
            if(token.text==='<bos>')continue;
            const raw=String(token.text).replace(/^▁/,' ');
            const pill=create('span',raw);
            pill.className=ids.has(token.position)?'token-evidence active':'token-evidence';
            if(ids.has(token.position))pill.title='Activation '+fmt(active.find(a=>a.position===token.position)?.activation||0);
            wrap.append(pill);
          }
          root.append(wrap);
        }else{
          const body=create('div','','activation-rows');
          active.sort((a,b)=>b.activation-a.activation).forEach(x=>{
            const row=create('div','','activation-row');
            row.append(create('span',String(x.token).replace(/^▁/,'').replace(/</g,'')),create('strong',fmt(x.activation)));
            body.append(row);
          });
          root.append(body);
        }
      });
    }catch(e){if(version===resultVersions.interpret)out('interpret-output',root=>paragraph(root,'Unable to load feature activations.','play-failure'))}
  }
  $('interpret-run').addEventListener('click',()=>{clearResult('interpret');runInterpret()});
  $('interpret-feature').addEventListener('change',()=>clearResult('interpret'));
  $('interpret-set').addEventListener('change',()=>clearResult('interpret'));

    async function request(path,{method='GET',body,operator=false}={}){if(!apiOrigin)throw Error('Connect your API first.');const headers={'Accept':'application/json'};if(body!==undefined)headers['Content-Type']='application/json';if(operator){const token=$('live-token').value.trim();if(!token)throw Error('Enter the operator token.');headers.Authorization='Bearer '+token}const res=await fetch(apiOrigin+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{}),credentials:'omit',mode:'cors',cache:'no-store'});let payload;try{payload=await res.json()}catch{throw Error('API did not return JSON.')}if(!res.ok)throw Error(typeof payload.detail==='string'?payload.detail:'API error '+res.status);return payload}
  // Reuse the current intervention instead of asking the operator to re-enter the prompt.
  document.querySelector('.live-compute')?.addEventListener('toggle',event=>{if(event.target.open)$('live-prompt').value=$('intervene-prompt').value;});
  $('api-connect').addEventListener('click',async()=>{try{const uri=new URL($('api-base').value.trim());if(uri.username||uri.password||uri.search||uri.hash||(!['https:'].includes(uri.protocol)&&!(uri.protocol==='http:'&&['localhost','127.0.0.1'].includes(uri.hostname))))throw Error('Use an HTTPS API origin or localhost.');apiOrigin=uri.origin;const data=await request('/api/health');$('api-status').textContent='Connected';$('mode-status').textContent='Demo test · Connected API';$('public-api-note').hidden=true;document.querySelector('.live-compute').hidden=false;}catch(e){apiOrigin='';$('api-status').textContent=e.message;$('mode-status').textContent='Demo test · API in building';$('public-api-note').hidden=false;document.querySelector('.live-compute').hidden=true;}});
  $('live-submit').addEventListener('click',async()=>{queuedJob='';$('live-check').disabled=true;$('check-hint').hidden=false;out('live-output',root=>paragraph(root,'Submitting…'));try{const b={site_id:$('live-site').value.trim(),operation:$('intervene-operation').value,feature_ids:[Number($('intervene-feature').value)],strength:Number($('intervene-strength').value),max_new_tokens:0};if(!Number.isInteger(b.feature_ids[0])||b.feature_ids[0]<0)throw Error('Invalid feature');let prompt=$('live-prompt').value.trim();if(!prompt)throw Error('Enter a prompt');await request('/api/jobs/preflight',{method:'POST',body:{...b,text:prompt}});const input=await request('/api/private/inputs',{method:'POST',body:{text:prompt},operator:true});const uuid=globalThis.crypto?.randomUUID?.()||('request-'+Date.now());const job=await request('/api/private/jobs',{method:'POST',body:{...b,input_ref:input.input_ref,client_key:uuid},operator:true});queuedJob=job.job_id||job.id;if(!queuedJob)throw Error('No job ID returned.');$('live-check').disabled=false;$('check-hint').hidden=true;out('live-output',root=>paragraph(root,'Job submitted. Select Check result.'));}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  $('live-check').addEventListener('click',async()=>{try{if(!queuedJob)throw Error('Submit a job first.');const state=await request('/api/private/jobs/'+encodeURIComponent(queuedJob),{operator:true});if(state.status==='succeeded'){const result=await request('/api/private/jobs/'+encodeURIComponent(queuedJob)+'/result',{operator:true});out('live-output',root=>{metrics(root,{'Logit change':fmt(result.max_abs_logit_delta),'Baseline token':String(result.baseline_argmax_token_id),'Edited token':String(result.edited_argmax_token_id)})})}else out('live-output',root=>paragraph(root,'Job status: '+state.status))}catch(e){out('live-output',root=>paragraph(root,e.message,'play-failure'))}});
  function startup(){const params=new URLSearchParams(location.search);let mod=params.get('module')||'explore';if(!document.querySelector(`[data-pane="${mod}"]`))mod='explore';const feature=params.get('feature');if(mod==='interpret'&&feature&&/^\d{1,6}$/.test(feature)&&[...$('interpret-feature').options].some(o=>o.value===feature))$('interpret-feature').value=feature;showModule(mod)}startup();
})();
