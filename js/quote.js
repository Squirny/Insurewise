(function(){
  var state={cover:null};
  var steps=document.querySelectorAll('.qstep');
  var bars=document.querySelectorAll('.progress .p');
  var cur=1;

  // pre-select cover from ?cover= or hero (optional)
  var params=new URLSearchParams(location.search);
  if(params.get('cover')) state.cover=params.get('cover');

  function show(n){
    cur=n;
    steps.forEach(function(s){ s.classList.toggle('active', +s.dataset.step===n); });
    bars.forEach(function(b,i){ b.classList.toggle('on', i<n); });
    window.scrollTo({top:0,behavior:'smooth'});
  }

  // cover selection
  document.querySelectorAll('[data-group="cover"] .opt').forEach(function(o){
    o.addEventListener('click',function(){
      document.querySelectorAll('[data-group="cover"] .opt').forEach(function(x){x.classList.remove('sel');});
      o.classList.add('sel'); state.cover=o.dataset.val;
      var nb=document.querySelector('[data-step="1"] [data-next]'); nb.disabled=false;
      // EB has no sum insured field need; toggle field label relevance
      var sif=document.getElementById('sumInsuredField');
      sif.style.display = (state.cover==='eb') ? 'none' : 'block';
    });
  });

  document.querySelectorAll('[data-next]').forEach(function(b){
    b.addEventListener('click',function(){ if(cur<3) show(cur+1); });
  });
  document.querySelectorAll('[data-prev]').forEach(function(b){
    b.addEventListener('click',function(){ if(cur>1) show(cur-1); });
  });

  function fmt(n){ return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }

  document.getElementById('calcBtn').addEventListener('click',function(){
    var email=document.getElementById('email').value.trim();
    if(email && email.indexOf('@')<0){ alert('Please enter a valid email / Masukkan email yang valid'); return; }
    var ind=parseFloat(document.getElementById('industry').value);
    var emp=parseInt(document.getElementById('employees').value,10);
    var si=parseFloat(document.getElementById('sumInsured').value);
    var base;
    switch(state.cover){
      case 'eb':       base = emp * 4200000 * ind; break;           // ~per-employee annual premium
      case 'property': base = si * 0.0018 * ind; break;             // rate on sum insured
      case 'liability':base = (8000000 + emp*120000) * ind; break;
      case 'cargo':    base = Math.max(si*0.0009, 7500000) * ind; break;
      default:         base = 10000000;
    }
    var low=base*0.85, high=base*1.2;
    document.getElementById('quoteRange').textContent = fmt(low) + ' – ' + fmt(high);
    show(4);

    // ---- Send the lead to the backend (Google Sheet + WhatsApp) ----
    var coverLabels={eb:'Employee Benefits',property:'Property',liability:'Liability',cargo:'Cargo & Marine'};
    var indSel=document.getElementById('industry');
    var empSel=document.getElementById('employees');
    var lead={
      cover: coverLabels[state.cover] || state.cover,
      industry: indSel.options[indSel.selectedIndex].text,
      employees: empSel.options[empSel.selectedIndex].text,
      sumInsured: (state.cover==='eb') ? 'N/A' : document.getElementById('sumInsured').options[document.getElementById('sumInsured').selectedIndex].text,
      company: document.getElementById('company').value.trim(),
      email: email,
      phone: document.getElementById('phone').value.trim(),
      estimate: fmt(low)+' – '+fmt(high),
      page: location.href,
      submittedAt: new Date().toISOString()
    };
    // Fire-and-forget; the user still sees their estimate even if this fails.
    fetch('/api/lead',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(lead)
    }).catch(function(){ /* network/endpoint not configured yet */ });
  });

  // if cover pre-set, mark it
  if(state.cover){
    var pre=document.querySelector('[data-group="cover"] .opt[data-val="'+state.cover+'"]');
    if(pre){ pre.click(); }
  }
})();
