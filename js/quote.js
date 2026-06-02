(function(){
  /* ====== CONFIG — edit these two lines ======================================
     WA_NUMBER: your WhatsApp business number, international format, digits only,
                no "+", no spaces. Example for +62 812-3456-7890 => "6281234567890".
     SHEET_WEBHOOK_URL: the Google Apps Script web-app URL (see SETUP-leads-whatsapp.md).
                Leave as "" to skip Google Sheet logging.
  =========================================================================== */
  var WA_NUMBER = window.IW_WA_NUMBER || "62XXXXXXXXXXX"; // set once in js/main.js
  var SHEET_WEBHOOK_URL = "https://script.google.com/a/macros/insurewise.club/s/AKfycbzAQR1VmSSJ_oXZ6SOzIZdW70dpk-Zpy87k6PS4ojRqhTerIoTFTC1azGJ4vFeDQZoWvA/exec";
  /* ========================================================================= */

  /* Property All Risks (PAR) rate build-up — general/standard risk benchmark.
     Each peril is rated on the sum insured (rate) plus an optional flat amount.
     Derived from the supplied simulator (Rp2bn example => Rp6,818,040 total). */
  var PAR_RATES = [
    { code:'FLEXAS',        en:'Fire, Lightning, Explosion, Aircraft, Smoke',        id:'Kebakaran, Petir, Ledakan, Kejatuhan Pesawat, Asap',          rate:0.0014790,   flat:0 },
    { code:'EQVET',         en:'Earthquake, Volcanic Eruption, Tsunami',             id:'Gempa Bumi, Letusan Gunung Berapi, Tsunami',                  rate:0.0014300,   flat:0 },
    { code:'TSFWD (4.3A)',  en:'Typhoon, Storm, Flood, Water Damage',                id:'Angin Topan, Badai, Banjir, Kerusakan Akibat Air',            rate:0.0005000,   flat:0 },
    { code:'RSMDCC (4.1B)', en:'Riot, Strike, Malicious Damage, Civil Commotion',    id:'Huru-hara, Pemogokan, Perbuatan Jahat, Kerusuhan Sipil',      rate:0.0000000100, flat:0 },
    { code:'Others',        en:'Other extensions',                                   id:'Perluasan lainnya',                                           rate:0.0000000100, flat:0 }
  ];

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
    var lang = document.documentElement.lang === 'id' ? 'id' : 'en';
    var bd = document.getElementById('quoteBreakdown');
    var estimateText;

    if (state.cover === 'property') {
      // ---- Property All Risks: itemised build-up on the sum insured ----
      var total = 0, rows = '';
      PAR_RATES.forEach(function(p){
        var prem = si * p.rate + p.flat;
        total += prem;
        var ratePct = (p.rate * 100).toLocaleString('en-US',{maximumFractionDigits:6}) + '%';
        rows += '<tr><td style="padding:8px 6px;border-bottom:1px solid var(--line)"><strong>'+p.code+'</strong><br><span style="color:var(--muted);font-size:.82rem">'+p[lang]+'</span></td>'+
                '<td style="padding:8px 6px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap">'+ratePct+'</td>'+
                '<td style="padding:8px 6px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap">'+fmt(prem)+'</td></tr>';
      });
      var hdr = (lang==='id')
        ? ['Komponen (Peril)','Rate','Premi']
        : ['Component (Peril)','Rate','Premium'];
      var totalLbl = (lang==='id') ? 'Estimasi Premi (PAR)' : 'Estimated Premium (PAR)';
      var siLbl = (lang==='id') ? 'Nilai pertanggungan' : 'Sum insured';
      document.getElementById('quoteRange').textContent = fmt(total);
      document.getElementById('quoteNote').textContent = (lang==='id')
        ? 'Property All Risks — estimasi indikatif' : 'Property All Risks — indicative estimate';
      bd.innerHTML =
        '<p style="font-size:.85rem;color:var(--muted);margin:14px 0 6px">'+siLbl+': <strong>'+fmt(si)+'</strong></p>'+
        '<table style="width:100%;border-collapse:collapse;font-size:.92rem;text-align:left">'+
        '<thead><tr>'+
        '<th style="padding:8px 6px;border-bottom:2px solid var(--line)">'+hdr[0]+'</th>'+
        '<th style="padding:8px 6px;border-bottom:2px solid var(--line);text-align:right">'+hdr[1]+'</th>'+
        '<th style="padding:8px 6px;border-bottom:2px solid var(--line);text-align:right">'+hdr[2]+'</th>'+
        '</tr></thead><tbody>'+rows+
        '<tr><td style="padding:10px 6px;font-weight:800">'+totalLbl+'</td><td></td>'+
        '<td style="padding:10px 6px;text-align:right;font-weight:800;color:var(--blue)">'+fmt(total)+'</td></tr>'+
        '</tbody></table>';
      bd.style.display = 'block';
      estimateText = fmt(total);
    } else {
      // ---- Other covers: indicative range (placeholder rates until guidelines added) ----
      var base;
      switch(state.cover){
        case 'eb':       base = emp * 4200000 * ind; break;
        case 'liability':base = (8000000 + emp*120000) * ind; break;
        case 'cargo':    base = Math.max(si*0.0009, 7500000) * ind; break;
        default:         base = 10000000;
      }
      var low=base*0.85, high=base*1.2;
      document.getElementById('quoteRange').textContent = fmt(low) + ' – ' + fmt(high);
      if (bd){ bd.innerHTML=''; bd.style.display='none'; }
      estimateText = fmt(low)+' – '+fmt(high);
    }
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
      estimate: estimateText,
      page: location.href,
      submittedAt: new Date().toISOString()
    };
    // 1) Log lead to Google Sheet (fire-and-forget; no-cors avoids preflight issues).
    if (SHEET_WEBHOOK_URL) {
      fetch(SHEET_WEBHOOK_URL,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify(lead)
      }).catch(function(){ /* not configured / offline — visitor still sees estimate */ });
    }

    // 2) Build the WhatsApp click-to-chat link with the lead pre-filled.
    var msg =
      "Hi Insurewise, I'd like a quote.\n" +
      "Cover: " + lead.cover + "\n" +
      "Company: " + (lead.company || "-") + "\n" +
      "Industry: " + lead.industry + "\n" +
      "Employees: " + lead.employees + "\n" +
      (lead.sumInsured!=='N/A' ? ("Sum insured: " + lead.sumInsured + "\n") : "") +
      "Email: " + (lead.email || "-") + "\n" +
      "Phone: " + (lead.phone || "-") + "\n" +
      "Indicative estimate shown: " + lead.estimate;
    var waBtn=document.getElementById('waBtn');
    if (waBtn){ waBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); }
  });

  // if cover pre-set, mark it
  if(state.cover){
    var pre=document.querySelector('[data-group="cover"] .opt[data-val="'+state.cover+'"]');
    if(pre){ pre.click(); }
  }
})();
