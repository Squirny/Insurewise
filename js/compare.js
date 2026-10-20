/* Insurewise plan comparator (/products/compare-health).
   Reads window.IW_PLANS / IW_ON_REQUEST from js/plans-data.js.
   State lives in the URL so results can be shared or bookmarked:
     ?totalEmployee=33&averageAge=23&room=750000&outpatient=any&orderBy=asc&budget=5000000&extras=Dental,Maternity&compare=id1,id2
*/
(function(){
  var PLANS = window.IW_PLANS || [], REQ = window.IW_ON_REQUEST || [];
  var WA = window.IW_WA_NUMBER || '6282114294549';
  var $ = function(id){ return document.getElementById(id); };
  var lang = function(){ return document.documentElement.lang === 'id' ? 'id' : 'en'; };
  var T = function(en, id){ return '<span data-en="'+en.replace(/"/g,'&quot;')+'" data-id="'+id.replace(/"/g,'&quot;')+'">'+(lang()==='id'?id:en)+'</span>'; };
  var t = function(en, id){ return lang()==='id' ? id : en; };
  var rp = function(n){ return 'Rp ' + Math.round(n).toLocaleString('id-ID'); };
  var rpShort = function(n){
    if(n >= 1e9) return 'Rp ' + (n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2}) + (lang()==='id'?' M':' bn');
    if(n >= 1e6) return 'Rp ' + (n/1e6).toLocaleString('id-ID',{maximumFractionDigits:2}) + (lang()==='id'?' jt':' mn');
    return 'Rp ' + Math.round(n/1e3).toLocaleString('id-ID') + (lang()==='id'?' rb':'k');
  };

  var MAX_PP = PLANS.reduce(function(m,p){ return Math.max(m, p.premium['56-60']||0); }, 0);
  var S = { emp:10, age:30, room:0, op:'any', sort:'asc', budget:0, extras:[], compare:[] };

  function band(age){
    if(age <= 30) return '19-30';
    if(age <= 40) return '31-40';
    if(age <= 55) return '41-55';
    if(age <= 60) return '56-60';
    return null;
  }
  function bandLabel(b){ return b ? b.replace('-', '–') : '60+'; }

  /* ---------- URL <-> state ---------- */
  function readURL(){
    var q = new URLSearchParams(location.search);
    var n = function(k, d){ var v = parseInt(q.get(k), 10); return isNaN(v) ? d : v; };
    S.emp = Math.min(5000, Math.max(1, n('totalEmployee', 10)));
    S.age = Math.min(70, Math.max(18, n('averageAge', 30)));
    S.room = n('room', 0);
    S.op = ['any','yes','no'].indexOf(q.get('outpatient')) >= 0 ? q.get('outpatient') : 'any';
    S.sort = ['asc','desc','room'].indexOf(q.get('orderBy')) >= 0 ? q.get('orderBy') : 'asc';
    S.budget = n('budget', 0);
    S.extras = (q.get('extras') || '').split(',').filter(Boolean);
    S.compare = (q.get('compare') || '').split(',').filter(function(id){ return PLANS.some(function(p){ return p.id === id; }); }).slice(0,3);
  }
  function writeURL(){
    var q = new URLSearchParams();
    q.set('totalEmployee', S.emp); q.set('averageAge', S.age);
    if(S.room) q.set('room', S.room);
    if(S.op !== 'any') q.set('outpatient', S.op);
    q.set('orderBy', S.sort);
    if(S.budget && S.budget < MAX_PP) q.set('budget', S.budget);
    if(S.extras.length) q.set('extras', S.extras.join(','));
    if(S.compare.length) q.set('compare', S.compare.join(','));
    try{ history.replaceState(null, '', location.pathname + '?' + q.toString()); }catch(e){}
  }
  function stateToForm(){
    $('pEmp').value = S.emp; $('pAge').value = S.age;
    $('pRoom').value = String(S.room); if($('pRoom').value !== String(S.room)){ $('pRoom').value = '0'; S.room = 0; }
    $('pOp').value = S.op; $('fOp').checked = S.op === 'yes';
    $('fSort').value = S.sort;
    var slider = $('fBudget'); slider.max = Math.ceil(MAX_PP/250000)*250000;
    slider.value = S.budget && S.budget < MAX_PP ? S.budget : slider.max;
    document.querySelectorAll('input[name=extra]').forEach(function(c){ c.checked = S.extras.indexOf(c.value) >= 0; });
  }
  function formToState(){
    S.emp = Math.min(5000, Math.max(1, parseInt($('pEmp').value,10) || 1));
    S.age = Math.min(70, Math.max(18, parseInt($('pAge').value,10) || 30));
    $('pEmp').value = S.emp; $('pAge').value = S.age;
    S.room = parseInt($('pRoom').value,10) || 0;
    S.op = $('pOp').value;
    S.sort = $('fSort').value;
    var b = parseInt($('fBudget').value,10); S.budget = b >= MAX_PP ? 0 : b;
    S.extras = Array.prototype.map.call(document.querySelectorAll('input[name=extra]:checked'), function(c){ return c.value; });
  }

  /* ---------- pricing + filtering ---------- */
  function priced(){
    var b = band(S.age);
    return PLANS.map(function(p){
      var pp = b ? (p.premium[b] || 0) : 0;
      return { p:p, pp:pp, total:pp*S.emp, band:b };
    });
  }
  function filtered(){
    var b = band(S.age);
    if(!b) return [];
    var list = priced().filter(function(r){
      var p = r.p;
      if(!r.pp) return false;
      if(S.age > p.maxEntryAge) return false;
      if(p.minGroup && S.emp < p.minGroup) return false;
      if(S.room && p.room < S.room) return false;
      if(S.op === 'yes' && p.coverage.indexOf('outpatient') < 0) return false;
      if(S.op === 'no' && p.coverage.indexOf('outpatient') >= 0) return false;
      if(S.budget && r.pp > S.budget) return false;
      return true;
    });
    list.sort(function(a,b){
      if(S.sort === 'desc') return b.total - a.total;
      if(S.sort === 'room') return (b.p.room - a.p.room) || (a.total - b.total);
      return a.total - b.total;
    });
    return list;
  }

  /* ---------- links ---------- */
  function waLink(r){
    var p = r.p;
    var msg = "Hi Insurewise, I'd like this employee health plan:\n" +
      "Plan: " + p.insurer + " " + p.product + ", " + p.plan_en + "\n" +
      "Employees: " + S.emp + "\nAverage age: " + S.age + "\n" +
      "Indicative premium shown: " + rp(r.total) + " / year (" + rp(r.pp) + " per employee)\n" +
      (S.extras.length ? "Also interested in: " + S.extras.join(', ') + "\n" : "") +
      "Comparison: " + location.href;
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }
  function waGeneric(name){
    var msg = "Hi Insurewise, please get me a group health quote from " + name + ".\n" +
      "Employees: " + S.emp + "\nAverage age: " + S.age + "\n" +
      (S.extras.length ? "Also interested in: " + S.extras.join(', ') + "\n" : "") +
      "Comparison: " + location.href;
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }
  function quoteLink(r){
    var q = new URLSearchParams({ cover:'eb', count:S.emp, age:r.band, ri:r.p.quote.ri, rj:r.p.quote.rj || '', plan:r.p.id });
    return '/quote?' + q.toString();
  }
  function finderLink(name){ return '/find-a-clinic?insurer=' + encodeURIComponent(name); }

  /* ---------- render ---------- */
  function covTags(p){
    var h = T('Inpatient','Rawat inap');
    var tags = '<span class="tag">'+h+'</span>';
    if(p.coverage.indexOf('outpatient') >= 0) tags += '<span class="tag">'+T('Outpatient','Rawat jalan')+'</span>';
    return tags;
  }
  function card(r, i, cheapestId){
    var p = r.p, sel = S.compare.indexOf(p.id) >= 0;
    var tags = covTags(p);
    if(p.verified) tags += '<span class="tag ok">'+T('Real rate card','Tarif resmi')+'</span>';
    if(p.id === cheapestId) tags += '<span class="tag low">'+T('Lowest price','Harga terendah')+'</span>';
    var op = p.opVisit ? rp(p.opVisit)+' '+t('/ visit','/ kunjungan') : '<span class="no">'+t('Not included','Tidak termasuk')+'</span>';
    var net = p.network ? p.network.total.toLocaleString('id-ID') + ' <a href="'+finderLink(p.network.finder)+'">'+t('See list','Lihat daftar')+'</a>' : '—';
    return '' +
    '<article class="plan'+(sel?' sel':'')+'" data-id="'+p.id+'">' +
      '<div class="p-id">' +
        '<div class="ins">'+p.insurer+'</div>' +
        '<div class="prod">'+p.product+'</div>' +
        '<div class="name">'+t(p.plan_en, p.plan_id)+'</div>' +
        '<div class="tags">'+tags+'</div>' +
      '</div>' +
      '<div class="p-spec">' +
        '<div class="spec"><span class="k">'+t('Room & board / night','Kamar / malam')+'</span><span class="v">'+rp(p.room)+'</span></div>' +
        '<div class="spec"><span class="k">'+t('Outpatient','Rawat jalan')+'</span><span class="v">'+op+'</span></div>' +
        '<div class="spec"><span class="k">'+t('Network providers','Jaringan provider')+'</span><span class="v">'+net+'</span></div>' +
        '<div class="spec"><span class="k">'+t('Inpatient hospitals','RS rawat inap')+'</span><span class="v">'+(p.network?p.network.inpatient.toLocaleString('id-ID'):'—')+'</span></div>' +
        '<div class="spec"><span class="k">'+t('Max entry age','Usia masuk maks')+'</span><span class="v">'+p.maxEntryAge+'</span></div>' +
        '<div class="spec"><span class="k">'+t('Claims','Klaim')+'</span><span class="v">'+t('Cashless & reimburse','Cashless & reimburse')+'</span></div>' +
      '</div>' +
      '<div class="p-price">' +
        '<span class="lbl">'+t('Annual premium · '+S.emp+' employees','Premi tahunan · '+S.emp+' karyawan')+'</span>' +
        '<div class="big">'+rp(r.total)+'</div>' +
        '<div class="pp">'+rp(r.pp)+' '+t('per employee / year','per karyawan / tahun')+'<br>≈ '+rp(r.pp/12)+' '+t('per employee / month','per karyawan / bulan')+'</div>' +
        '<a class="btn btn-primary" target="_blank" rel="noopener" href="'+waLink(r)+'">'+t('Get this plan','Ambil plan ini')+'</a>' +
        '<a class="btn btn-ghost" href="'+quoteLink(r)+'">'+t('Request formal quote','Minta penawaran resmi')+'</a>' +
        '<label class="chk cmpchk"><input type="checkbox" data-cmp="'+p.id+'"'+(sel?' checked':'')+'> '+t('Add to compare','Tambah ke perbandingan')+'</label>' +
      '</div>' +
    '</article>';
  }

  function render(){
    var list = filtered();
    var b = band(S.age);
    $('resCount').innerHTML = list.length + ' ' + t(list.length===1?'plan':'plans','plan') +
      ' <span>' + t('for','untuk') + ' ' + S.emp + ' ' + t('employees, average age','karyawan, rata-rata usia') + ' ' + S.age +
      (b ? ' (' + t('band','kelompok') + ' ' + bandLabel(b) + ')' : '') + '</span>';
    $('fBudgetVal').textContent = S.budget ? t('Up to ','Hingga ') + rp(S.budget) : t('No limit','Tanpa batas');

    var html;
    if(!b){
      html = '<div class="empty">'+t('The plans we can price instantly accept members up to age 60. For an older workforce, our advisor will source a plan for you.','Plan dengan harga instan menerima peserta hingga usia 60. Untuk karyawan yang lebih senior, penasihat kami akan carikan plan yang sesuai.')+
        '<br><br><a class="btn btn-primary" target="_blank" rel="noopener" href="'+waGeneric('your partner insurers')+'">'+t('Ask an advisor','Tanya penasihat')+'</a></div>';
    } else if(!list.length){
      html = '<div class="empty">'+t('No plans match these filters. Try a lower room limit or a higher budget.','Tidak ada plan yang cocok dengan filter ini. Coba limit kamar lebih rendah atau anggaran lebih tinggi.')+'</div>';
    } else {
      var cheapestId = list.reduce(function(m,r){ return (!m || r.total < m.total) ? r : m; }, null).p.id;
      html = list.map(function(r,i){ return card(r,i,cheapestId); }).join('');
    }
    $('planList').innerHTML = html;

    $('reqGrid').innerHTML = REQ.map(function(x){
      var warn = x.minGroup && S.emp < x.minGroup ? '<span class="warn">'+t('Usually needs '+x.minGroup+'+ members','Biasanya minimal '+x.minGroup+' peserta')+'</span>' : '';
      var meta = [];
      if(x.minGroup) meta.push(t('From '+x.minGroup+' members','Mulai '+x.minGroup+' peserta'));
      if(x.network) meta.push('<a href="'+finderLink(x.finder)+'">'+x.network.toLocaleString('id-ID')+' '+t('providers','provider')+'</a>');
      return '<div class="req"><span class="ins">'+x.name+'</span><p>'+t(x.en,x.id)+'</p>' +
        (meta.length?'<span class="meta">'+meta.join(' · ')+'</span>':'') + warn +
        '<a class="btn btn-ghost" target="_blank" rel="noopener" href="'+waGeneric(x.name)+'">'+t('Get a price','Minta harga')+'</a></div>';
    }).join('');

    renderTray();
    writeURL();
  }

  /* ---------- compare tray + modal ---------- */
  function byId(id){ return priced().filter(function(r){ return r.p.id === id; })[0]; }
  function renderTray(){
    var tray = $('tray');
    tray.classList.toggle('on', S.compare.length > 0);
    $('trayChips').innerHTML = S.compare.map(function(id){
      var r = byId(id); if(!r) return '';
      return '<span class="chip">'+r.p.insurer+' '+t(r.p.plan_en, r.p.plan_id)+' <button type="button" data-rm="'+id+'" aria-label="Remove">×</button></span>';
    }).join('') + (S.compare.length < 2 ? '<span style="font-size:.82rem;color:var(--muted);align-self:center">'+t('Pick up to 3 plans','Pilih hingga 3 plan')+'</span>' : '');
    $('compareBtn').disabled = S.compare.length < 2;
    $('compareBtn').style.opacity = S.compare.length < 2 ? .5 : 1;
  }
  function toggleCompare(id, on){
    var i = S.compare.indexOf(id);
    if(on && i < 0){
      if(S.compare.length >= 3){ alert(t('You can compare up to 3 plans.','Maksimal 3 plan untuk dibandingkan.')); return false; }
      S.compare.push(id);
    } else if(!on && i >= 0){ S.compare.splice(i,1); }
    return true;
  }
  function openModal(){
    var rows = S.compare.map(byId).filter(Boolean);
    if(rows.length < 2) return;
    var minTotal = Math.min.apply(null, rows.map(function(r){ return r.total; }));
    var maxRoom = Math.max.apply(null, rows.map(function(r){ return r.p.room; }));
    var cell = function(fn){ return rows.map(function(r){ return '<td>'+fn(r)+'</td>'; }).join(''); };
    var tr = function(label, fn){ return '<tr><th>'+label+'</th>'+cell(fn)+'</tr>'; };
    $('modalSub').textContent = S.emp + ' ' + t('employees, average age','karyawan, rata-rata usia') + ' ' + S.age;
    $('ctable').innerHTML = '<table class="ctable"><thead><tr><th></th>' +
      cell(function(r){ return r.p.insurer + '<br><span style="font-weight:600;color:var(--ink);font-size:.88rem">'+t(r.p.plan_en,r.p.plan_id)+'</span>'; }) +
      '</tr></thead><tbody>' +
      tr(t('Annual premium (group)','Premi tahunan (grup)'), function(r){ return '<span class="'+(r.total===minTotal?'best':'')+'">'+rp(r.total)+'</span>'; }) +
      tr(t('Per employee / year','Per karyawan / tahun'), function(r){ return rp(r.pp); }) +
      tr(t('Per employee / month','Per karyawan / bulan'), function(r){ return '≈ '+rp(r.pp/12); }) +
      tr(t('Room & board / night','Kamar / malam'), function(r){ return '<span class="'+(r.p.room===maxRoom?'best':'')+'">'+rp(r.p.room)+'</span>'; }) +
      tr(t('Outpatient','Rawat jalan'), function(r){ return r.p.opVisit ? rp(r.p.opVisit)+' '+t('/ visit','/ kunjungan') : '<span class="no">'+t('Not included','Tidak termasuk')+'</span>'; }) +
      tr(t('Network providers','Jaringan provider'), function(r){ return r.p.network ? r.p.network.total.toLocaleString('id-ID') : '—'; }) +
      tr(t('Inpatient hospitals','RS rawat inap'), function(r){ return r.p.network ? r.p.network.inpatient.toLocaleString('id-ID') : '—'; }) +
      tr(t('Max entry age','Usia masuk maks'), function(r){ return r.p.maxEntryAge; }) +
      tr(t('Rate source','Sumber tarif'), function(r){ return r.p.verified ? t('Insurer rate card','Tabel tarif asuransi') : t('Indicative','Indikatif'); }) +
      tr('', function(r){ return '<a class="btn btn-primary" target="_blank" rel="noopener" href="'+waLink(r)+'">'+t('Choose','Pilih')+'</a>'; }) +
      '</tbody></table>';
    $('modal').classList.add('on');
    $('modalX').focus();
  }
  function closeModal(){ $('modal').classList.remove('on'); }

  /* ---------- events ---------- */
  function update(){ formToState(); render(); }
  document.addEventListener('DOMContentLoaded', function(){
    readURL(); stateToForm(); render();

    $('goBtn').addEventListener('click', function(){ update(); $('results').scrollIntoView({behavior:'smooth'}); });
    ['pRoom','pOp','fSort'].forEach(function(id){ $(id).addEventListener('change', update); });
    ['pEmp','pAge'].forEach(function(id){ $(id).addEventListener('change', update); });
    $('fOp').addEventListener('change', function(){ $('pOp').value = this.checked ? 'yes' : 'any'; update(); });
    $('fBudget').addEventListener('input', update);
    document.querySelectorAll('input[name=extra]').forEach(function(c){ c.addEventListener('change', update); });
    $('filtersToggle').addEventListener('click', function(){ $('sidebar').classList.toggle('open'); });

    $('planList').addEventListener('change', function(e){
      var id = e.target.getAttribute && e.target.getAttribute('data-cmp');
      if(!id) return;
      if(!toggleCompare(id, e.target.checked)) e.target.checked = false;
      render();
    });
    $('trayChips').addEventListener('click', function(e){
      var id = e.target.getAttribute('data-rm'); if(!id) return;
      toggleCompare(id, false); render();
    });
    $('compareBtn').addEventListener('click', openModal);
    $('modalX').addEventListener('click', closeModal);
    $('modal').addEventListener('click', function(e){ if(e.target === this) closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

    // re-render dynamic content when language changes (main.js handles static labels)
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){
      b.addEventListener('click', function(){ setTimeout(function(){ render(); if($('modal').classList.contains('on')) openModal(); }, 0); });
    });
  });
})();
