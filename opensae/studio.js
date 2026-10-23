(()=>{
  const btn=document.querySelector('.menu-toggle');const nav=document.querySelector('#site-nav');
  if(btn&&nav){btn.addEventListener('click',()=>{const opened=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(opened));});}
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{if(nav){nav.classList.remove('open');btn?.setAttribute('aria-expanded','false');}}));
})();
