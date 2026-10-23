(()=>{
const panes=[...document.querySelectorAll('.workspace-panel')],tabs=[...document.querySelectorAll('[data-module]')];
const available=new Set(panes.map(p=>p.dataset.pane));
function select(name,{history=true}={}){if(!available.has(name))name='explore';panes.forEach(p=>p.classList.toggle('active',p.dataset.pane===name));tabs.forEach(b=>{const on=b.dataset.module===name;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});if(history){const u=new URL(location.href);u.searchParams.set('module',name);window.history.replaceState(null,'',u.toString());}document.title=name[0].toUpperCase()+name.slice(1)+' / SAEBase — OpenSAE';}
tabs.forEach(b=>b.addEventListener('click',()=>select(b.dataset.module)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.goto)));
document.getElementById('focus-feature')?.addEventListener('click',()=>{document.querySelector('.ws-feature')?.scrollIntoView({behavior:'smooth',block:'center'});});
select(new URL(location.href).searchParams.get('module')||'explore',{history:false});
})();
