/* ===========================================================================
   INSUREWISE — READY-MADE PLAN CATALOGUE (powers /products/compare-health)
   ---------------------------------------------------------------------------
   Two lists:
     IW_PLANS        → priced plans. ONLY add a plan here when you hold the
                       insurer's real rate card. Premium = per person / year.
     IW_ON_REQUEST   → partner insurers we place but have no public rate card
                       for yet. Shown below the results as "price on request".

   PLAN FIELDS
     id            unique slug (used in URL + compare tray)
     insurer       brand name on the card
     product       insurer product name
     plan_en/_id   plan label
     room          inpatient room & board per night (IDR)
     opVisit       outpatient limit per visit (IDR) or null if not included
     coverage      array of: 'inpatient','outpatient','dental','maternity','optical','life','pa'
     premium       { '0-18':n, '19-30':n, '31-40':n, '41-55':n, '56-60':n }  per person / year
     maxEntryAge   oldest age the product accepts at entry
     minGroup      minimum number of members (null = not stated)
     network       { total, inpatient, finder }  — counts from data/providers.json
     verified      true = real rate card  ·  false = indicative
     source        where the numbers came from (shown in small print)
     quote         { ri, rj } passed to /quote so the form arrives prefilled

   NOTE: js/quote.js holds the same Lippo tables for the quote wizard. If the
   insurer re-prices, update BOTH files.
=========================================================================== */
(function(){
  // Lippo HealthPlus Business Essential — Cashless & Reimburse 100%.
  // Annual premium per person by age band. Same table as js/quote.js.
  var RI = {
    RI2500:{'0-18':4060000,'19-30':5800000,'31-40':5800000,'41-55':8700000,'56-60':10440000},
    RI1750:{'0-18':2723000,'19-30':3890000,'31-40':3890000,'41-55':5835000,'56-60':7002000},
    RI1200:{'0-18':2415000,'19-30':3450000,'31-40':3450000,'41-55':5175000,'56-60':6210000},
    RI750: {'0-18':1718500,'19-30':2455000,'31-40':2455000,'41-55':3682500,'56-60':4419000},
    RI600: {'0-18':1288000,'19-30':1610000,'31-40':1610000,'41-55':2415000,'56-60':2898000},
    RI350: {'0-18':884000, '19-30':1105000,'31-40':1105000,'41-55':1657500,'56-60':1989000}
  };
  var RJ = {
    RJ150:{'0-18':3795000,'19-30':2935000,'31-40':3450000,'41-55':4140000,'56-60':6210000},
    RJ100:{'0-18':2910000,'19-30':2250000,'31-40':2645000,'41-55':3175000,'56-60':4765000},
    RJ80: {'0-18':2235000,'19-30':1730000,'31-40':2030000,'41-55':2440000,'56-60':3655000},
    RJ50: {'0-18':1725000,'19-30':1335000,'31-40':1565000,'41-55':1880000,'56-60':2820000},
    RJ35: {'0-18':1075000,'19-30':830000, '31-40':975000, '41-55':1170000,'56-60':1755000},
    RJ25: {'0-18':855000, '19-30':660000, '31-40':775000, '41-55':930000, '56-60':1395000}
  };
  // Ready-made packages: each room tier, inpatient-only and with its matching outpatient tier.
  var TIERS = [
    {n:1, ri:'RI2500', rj:'RJ150', room:2500000, op:150000},
    {n:2, ri:'RI1750', rj:'RJ100', room:1750000, op:100000},
    {n:3, ri:'RI1200', rj:'RJ80',  room:1200000, op:80000},
    {n:4, ri:'RI750',  rj:'RJ50',  room:750000,  op:50000},
    {n:5, ri:'RI600',  rj:'RJ35',  room:600000,  op:35000},
    {n:6, ri:'RI350',  rj:'RJ25',  room:350000,  op:25000}
  ];
  var LIPPO_NETWORK = { total:1234, inpatient:786, finder:'Lippo HealthPlus' };
  var plans = [];
  TIERS.forEach(function(t){
    var base = {
      insurer:'Lippo', product:'HealthPlus Business Essential',
      room:t.room, maxEntryAge:60, minGroup:null, network:LIPPO_NETWORK,
      verified:true, source:'Lippo HealthPlus Business Essential rate table'
    };
    plans.push(Object.assign({}, base, {
      id:'lippo-hp-'+t.n+'-ip',
      plan_en:'Plan '+t.n+' · Inpatient', plan_id:'Plan '+t.n+' · Rawat Inap',
      opVisit:null, coverage:['inpatient'],
      premium:RI[t.ri], quote:{ri:t.ri, rj:''}
    }));
    var both = {};
    Object.keys(RI[t.ri]).forEach(function(b){ both[b] = RI[t.ri][b] + RJ[t.rj][b]; });
    plans.push(Object.assign({}, base, {
      id:'lippo-hp-'+t.n+'-ipop',
      plan_en:'Plan '+t.n+' · Inpatient + Outpatient', plan_id:'Plan '+t.n+' · Rawat Inap + Rawat Jalan',
      opVisit:t.op, coverage:['inpatient','outpatient'],
      premium:both, quote:{ri:t.ri, rj:t.rj}, parts:{ri:RI[t.ri], rj:RJ[t.rj]}
    }));
  });
  window.IW_PLANS = plans;

  // Partners without a public rate card: indicative facts only (verify before relying).
  window.IW_ON_REQUEST = [
    { name:'AXA',          minGroup:null, en:'SmartCare Executive: wide network, high limits', id:'SmartCare Executive: jaringan luas, limit tinggi' },
    { name:'Zurich',       minGroup:null, en:'Pro-Care group plans, 4 tiers', id:'Plan kelompok Pro-Care, 4 tingkatan', finder:'Zurich', network:2318 },
    { name:'Allianz',      minGroup:10,   en:'SmartHealth group plans', id:'Plan kelompok SmartHealth' },
    { name:'AIA',          minGroup:null, en:'Employee benefit health & life', id:'Employee benefit kesehatan & jiwa', finder:'AIA', network:2812 },
    { name:'Hanwha',       minGroup:null, en:'Group health cover', id:'Asuransi kesehatan kelompok', finder:'Hanwha', network:8229 },
    { name:'Sunday',       minGroup:3,    en:'Digital group health', id:'Kesehatan kelompok digital', finder:'Sunday', network:8122 },
    { name:'Mandiri',      minGroup:null, en:'Mandiri Inhealth: large provider network', id:'Mandiri Inhealth: jaringan provider luas' },
    { name:'ACA',          minGroup:25,   en:'Medi+ group health', id:'Medi+ kesehatan kelompok' },
    { name:'Tokio Marine', minGroup:null, en:'Life & employee benefits', id:'Asuransi jiwa & employee benefit' }
  ];
})();
