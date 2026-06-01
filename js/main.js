// Bilingual toggle + mobile nav
(function(){
  function setLang(lang){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function(el){
      var v = el.getAttribute('data-'+lang);
      if(v===null) return;
      if(el.placeholder!==undefined && (el.tagName==='INPUT'||el.tagName==='TEXTAREA')){ el.placeholder=v; }
      else { el.innerHTML=v; }
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang-btn')===lang);
    });
    try{ localStorage.setItem('iw_lang',lang); }catch(e){}
  }
  window.iwSetLang=setLang;
  document.addEventListener('DOMContentLoaded',function(){
    var saved='en'; try{ saved=localStorage.getItem('iw_lang')||'en'; }catch(e){}
    setLang(saved);
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){
      b.addEventListener('click',function(){ setLang(b.getAttribute('data-lang-btn')); });
    });
    var burger=document.querySelector('.burger'), links=document.querySelector('.nav-links');
    if(burger){ burger.addEventListener('click',function(){ links.classList.toggle('open'); }); }
  });
})();
