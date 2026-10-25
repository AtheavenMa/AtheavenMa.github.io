/* Interactive, dependency-free SVG explorer for three source-linked trees. */
(function(){
"use strict";
var DATA=window.OPENRESEARCH_ATLAS||{}, name="knowledge", selected=null, query="", zoom=1, expanded=new Set(), diff=null;
var parents=new Map(), children=new Map(), visible=[];
var cfg={
 knowledge:{root:"q.research",title:"Why we build.",sub:"RESEARCH QUESTIONS & GOALS",primary:["refines","addresses","decomposes"]},
 code:{root:"code:root",title:"How it works.",sub:"CODE STRUCTURE & INTERFACES",primary:["contains"]},
 environment:{root:"env:root",title:"Where it runs.",sub:"EXECUTION & MACHINE CONTEXT",primary:["contains"]}
};
var $=id=>document.getElementById(id),g=()=>DATA[name]||{nodes:[],edges:[],gates:[]}, nodes=()=>new Map(g().nodes.map(n=>[n.id,n])),kind=n=>n.kind||n.type||"node";
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
function svg(tag,attrs,text){var e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(var k in attrs)e.setAttribute(k,String(attrs[k]));if(text!==undefined)e.textContent=String(text);return e;}
function short(t,n){var a=Array.from(String(t||""));return a.length>n?a.slice(0,n-1).join("")+"…":a.join("");}
function sortNodes(a,b){var w={root:0,question:1,solve:2,goal:3,group:1,module:2,class:3,function:4,method:5};return ((w[kind(a)]||9)-(w[kind(b)]||9))||String(a.title).localeCompare(String(b.title),"zh");}
function hierarchy(){
 var map=nodes();parents=new Map();children=new Map();
 for(var e of g().edges||[]){
  if(!cfg[name].primary.includes(e.type)||!map.has(e.source)||!map.has(e.target)||parents.has(e.target))continue;
  parents.set(e.target,e.source);
  if(!children.has(e.source))children.set(e.source,[]);
  children.get(e.source).push(e.target);
 }
 for(var a of children.values())a.sort((x,y)=>sortNodes(map.get(x),map.get(y)));
}
function roots(){if(nodes().has(cfg[name].root))return [cfg[name].root];return g().nodes.filter(n=>!parents.has(n.id)).sort(sortNodes).map(n=>n.id);}
function openTo(id){var c=id,n=0;while(parents.has(c)&&n++<100){c=parents.get(c);expanded.add(c);}}
function match(n){var q=query.trim().toLowerCase();return !q||[n.id,n.title,n.description,n.path,(n.context_ids||[]).join(" ")].join(" ").toLowerCase().includes(q);}
function visibleNodes(){
 var map=nodes(),needed=new Set();
 if(query.trim())for(var n of map.values())if(match(n)){var c=n.id,z=0;needed.add(c);while(parents.has(c)&&z++<100){c=parents.get(c);needed.add(c);}}
 var output=[],seen=new Set();
 function walk(id,d){if(seen.has(id)||!map.has(id)||d>12)return;seen.add(id);
  if(!query.trim()||needed.has(id))output.push({id:id,depth:d,node:map.get(id)});
  if(query.trim()||expanded.has(id))for(var ch of children.get(id)||[])walk(ch,d+1);
 }
 roots().forEach(r=>walk(r,0));return output;
}
function selectedGraphNode(id){selected=id;openTo(id);render();}
function switchGraph(next){
 if(!cfg[next])return;name=next;selected=null;query="";zoom=1;$("search").value="";
 hierarchy();expanded=new Set(roots());
 if(next==="environment")for(var n of g().nodes)if(kind(n)==="group")expanded.add(n.id);
 $("graphTitle").textContent=cfg[next].title;$("graphSubtitle").textContent=cfg[next].sub;
 document.querySelectorAll(".tab").forEach(e=>e.classList.toggle("active",e.dataset.graph===next));
 $("canvasWrap").scrollTop=0;$("canvasWrap").scrollLeft=0;render();
}
function renderSVG(){
 visible=visibleNodes();var root=$("diagram");root.replaceChildren();
 var dx=250,dy=79,w=202,h=62,positions=new Map();
 visible.forEach((v,i)=>positions.set(v.id,{x:30+v.depth*dx,y:32+i*dy}));
 var maxDepth=Math.max(2,...visible.map(v=>v.depth));
 var width=Math.max(720,maxDepth*dx+300),height=Math.max(450,visible.length*dy+100);
 root.setAttribute("width",width*zoom);root.setAttribute("height",height*zoom);
 root.setAttribute("viewBox","0 0 "+width+" "+height);
 var links=svg("g",{}),boxes=svg("g",{}),chSet=new Set((diff&&name==="code"?(diff.changed||[]):[]).map(x=>x.id)),addSet=new Set(diff&&name==="code"?diff.added_ids||[]:[]);
 for(let v of visible){
  var p=parents.get(v.id);
  if(!p||!positions.has(p))continue;
  var a=positions.get(p),b=positions.get(v.id),x1=a.x+w,y1=a.y+h/2,x2=b.x,y2=b.y+h/2,mid=(x1+x2)/2;
  links.appendChild(svg("path",{"class":"link-primary","d":"M "+x1+" "+y1+" C "+mid+" "+y1+", "+mid+" "+y2+", "+x2+" "+y2}));
 }
 for(let v of visible){
  var n=v.node,pos=positions.get(v.id),isRoot=v.depth===0;
  var cls=["graph-node",isRoot?"node-root":"",kind(n)==="group"?"node-group":"",
   selected===v.id?"node-selected":"",chSet.has(v.id)?"node-changed":"",
   addSet.has(v.id)?"node-added":"",query&&match(n)?"node-match":""].filter(Boolean).join(" ");
  var shape=svg("g",{"class":cls,"transform":"translate("+pos.x+","+pos.y+")","role":"button","tabindex":"0","aria-label":n.title});
  shape.appendChild(svg("rect",{"class":"node-rect",width:w,height:h,rx:5}));
  shape.appendChild(svg("text",{x:13,y:15,"class":"node-kind"},kind(n).toUpperCase()));
  shape.appendChild(svg("text",{x:13,y:36,"class":"node-label"},short(n.title,25)));
  var gate=(g().gates||[]).find(x=>x.parent===v.id);
  shape.appendChild(svg("text",{x:13,y:52,"class":"node-caption"},short(gate?gate.operator+" · "+kind(n):n.status||kind(n),28)));
  if((children.get(v.id)||[]).length)shape.appendChild(svg("text",{x:w-18,y:37,"class":"node-toggle"},expanded.has(v.id)?"−":"+"));
  var action=()=>{selected=v.id;if((children.get(v.id)||[]).length){if(expanded.has(v.id))expanded.delete(v.id);else expanded.add(v.id);}render();};
  shape.addEventListener("click",action);
  shape.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();action();}});
  boxes.appendChild(shape);
 }
 root.append(links,boxes);
 $("totalCount").textContent=g().nodes.length;$("treeCount").textContent=visible.length+"/"+g().nodes.length;
 $("zoomValue").textContent=Math.round(zoom*100)+"%";
}
function renderOutline(){
 var area=$("outline"),frag=document.createDocumentFragment();area.replaceChildren();
 for(let v of visible){
  let n=v.node,btn=el("button","outline-item"+(selected===v.id?" active":""));
  btn.style.paddingLeft=(8+v.depth*11)+"px";btn.setAttribute("role","treeitem");
  btn.appendChild(el("span","outline-toggle",(children.get(v.id)||[]).length?(expanded.has(v.id)?"⌄":"›"):"·"));
  btn.appendChild(el("span","outline-name",n.title));
  if(v.depth<3)btn.appendChild(el("span","outline-kind",kind(n)));
  btn.title=n.id;btn.addEventListener("click",()=>selectedGraphNode(n.id));frag.appendChild(btn);
 }
 if(!visible.length)frag.appendChild(el("p","empty-detail","No matching nodes."));area.appendChild(frag);
}
function section(area,label){var box=el("section","info-block");box.appendChild(el("div","section-label",label));area.appendChild(box);return box;}
function linkTo(id,label){
 var btn=el("button","detail-link",label);
 btn.style.cssText="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-top:0";
 btn.addEventListener("click",()=>{
  var target=/^(q\.|s\.|g\.)/.test(id)?"knowledge":id.startsWith("env:")?"environment":name;
  if(target!==name)switchGraph(target);selectedGraphNode(id);
 });return btn;
}
function renderDetails(){
 var area=$("detailBody");area.replaceChildren();var m=nodes(),n=m.get(selected);
 if(!n){area.appendChild(el("p","empty-detail","Select a node to inspect its explanation, status and source evidence."));return;}
 area.appendChild(el("div","micro",kind(n).toUpperCase()+" · "+n.id));
 area.appendChild(el("h3","",n.title));
 var bar=el("div","statusline");bar.appendChild(el("span","pill",n.status||"Source linked"));
 if(n.needs_review)bar.appendChild(el("span","pill","Needs review"));
 if(name==="environment"&&g().synthetic)bar.appendChild(el("span","pill","SYNTHETIC EXAMPLE"));
 area.appendChild(bar);area.appendChild(el("p","",n.description||"No confirmed description."));
 var gate=(g().gates||[]).find(x=>x.parent===n.id);
 if(gate){var box=section(area,"COMPLETION LOGIC");box.appendChild(el("p","",gate.operator==="AND"?"All child goals are required.":"At least one child goal is sufficient."));
  for(var child of gate.children)box.appendChild(linkTo(child,m.get(child)?.title||child));
 }
 if(n.signature){var box=section(area,"SIGNATURE");box.appendChild(el("pre","signature",n.signature));}
 if(n.next){var box=section(area,"NEXT STEP");box.appendChild(el("p","",n.next));}
 var evidence=[...(n.evidence||[])];if(!evidence.length&&n.path)evidence.push(n.path);
 if(evidence.length){var box=section(area,"EVIDENCE / SOURCE");
  for(var src of evidence){var a=el("a","detail-link",src);var path=src.split(":")[0];
   if(path.startsWith("https://")){a.href=path;a.target="_blank";a.rel="noopener noreferrer";}
   else if(!path.startsWith("/")&&!path.includes("..")){a.href="https://github.com/OpenSAE/OpenResearch/blob/main/"+path;a.target="_blank";a.rel="noopener noreferrer";}
   box.appendChild(a);
  }
 }
 if((n.context_ids||[]).length){var box=section(area,"RESEARCH CONTEXT");
  for(var key of n.context_ids)box.appendChild(linkTo(key,key+" · "+(DATA.knowledge?.nodes.find(x=>x.id===key)?.title||"")));
 }
 if((n.environment_refs||[]).length){var box=section(area,"ENVIRONMENT DEPENDENCIES");for(var key of n.environment_refs)box.appendChild(el("div","detail-link",key));}
 var other=(g().edges||[]).filter(e=>(e.source===n.id||e.target===n.id)&&(!cfg[name].primary.includes(e.type)||parents.get(e.target)!==e.source));
 if(other.length){var box=section(area,"RELATED CONNECTIONS");for(var e of other.slice(0,24)){var id=e.source===n.id?e.target:e.source;
  box.appendChild(linkTo(id,(e.source===n.id?"→ ":"← ")+e.type+" · "+(m.get(id)?.title||id)));
 }}
 if(diff&&name==="code"){var change=(diff.changed||[]).find(x=>x.id===n.id);if(change){var box=section(area,"OBSERVED CODE CHANGE");box.appendChild(el("p","",change.fields.join(", ")));}}
}
function render(){renderSVG();renderOutline();renderDetails();
 var fake=name==="environment"&&g().synthetic;
 $("dataNote").textContent=fake?"Synthetic preview · not real hardware":"Click nodes to inspect connections and evidence.";
 $("sourceState").textContent=fake?"SYNTHETIC DATA · EXAMPLE ONLY":"Source-backed research infrastructure";
 $("footerSource").textContent=name==="knowledge"?"Source: doc/knowledge/context_graph.json":name==="code"?"Source: Python AST snapshot":"Source: machine probe or synthetic preview";
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchGraph(b.dataset.graph)));
$("search").addEventListener("input",ev=>{query=ev.target.value;render();});
$("collapse").addEventListener("click",()=>{expanded=new Set(roots());render();});
$("expand").addEventListener("click",()=>{for(var n of g().nodes)expanded.add(n.id);render();});
$("fit").addEventListener("click",()=>{zoom=1;render();$("canvasWrap").scrollTo({left:0,top:0});});
$("zoomIn").addEventListener("click",()=>{zoom=Math.min(2,Math.round((zoom+.15)*100)/100);render();});
$("zoomOut").addEventListener("click",()=>{zoom=Math.max(.4,Math.round((zoom-.15)*100)/100);render();});
$("diffFile").addEventListener("change",async ev=>{var file=ev.target.files?.[0];if(!file)return;try{
 var d=JSON.parse(await file.text());if(d.kind!=="code_diff")throw Error("Expected code_diff JSON");
 diff=d;switchGraph("code");
 $("legendMain").textContent="Code delta: "+(d.added_ids?.length||0)+" added · "+(d.removed_ids?.length||0)+" removed · "+(d.changed?.length||0)+" changed";
 }catch(error){alert("Cannot load code diff: "+error.message);}ev.target.value="";
});
switchGraph(document.body?.dataset?.atlasView || "knowledge");
})();

