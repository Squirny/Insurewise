// ===== CONFIG: set your WhatsApp number once here =====
// International format, digits only, no "+" or spaces.
// Example for +62 812-3456-7890 => "6281234567890"
window.IW_WA_NUMBER = "6282114294549";   // WhatsApp business number
// ======================================================

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

    // Floating WhatsApp chat button (all pages)
    if(window.IW_WA_NUMBER && window.IW_WA_NUMBER.indexOf('X')<0){
      var a=document.createElement('a');
      a.href='https://wa.me/'+window.IW_WA_NUMBER+'?text='+encodeURIComponent("Hi Insurewise, I'd like to ask about business insurance.");
      a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label','Chat on WhatsApp');
      a.style.cssText='position:fixed;right:20px;bottom:20px;z-index:60;width:58px;height:58px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.22)';
      a.innerHTML='<svg width="30" height="30" viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.3l-.4-.2-4.9 1 1-4.8-.2-.4c-.9-1.5-1.4-3.3-1.4-5.1C5.1 9.6 9.9 4.9 16 4.9S26.9 9.6 26.9 15 22.1 24.8 16 24.8zm5.6-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-.9 1.2c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/></svg>';
      document.body.appendChild(a);
    }
  });
})();
