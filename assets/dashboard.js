
const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const SECTIONS=[
  {id:'cover',t:'Sampul'},{id:'mtt',t:'MTT'},{id:'capaian',t:'Total capaian'},{id:'anggaran',t:'Anggaran'},
  {id:'highlight',t:'Highlight kegiatan'},{id:'tantangan',t:'Tantangan dan dukungan'},{id:'rencana',t:'Rencana kerja'},{id:'penutup',t:'Penutup'}];
/* nomor bagian: sampul dan penutup tidak bernomor */
const NUM=id=>{const k=SECTIONS.findIndex(s=>s.id===id);return (id==='cover'||id==='penutup')?0:k};
const ST={per:null,sec:'cover',kab:'Semua',bud:'Semua',slide:0,scope:'semester'};

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fN=(v,d)=>v==null?'–':Number(v).toLocaleString('id-ID',{maximumFractionDigits:d??(Math.abs(v-Math.round(v))>1e-9?1:0)});
const fP=(v,d=0)=>v==null?'–':(v*100).toLocaleString('id-ID',{maximumFractionDigits:d})+'%';
const key=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
const parse=k=>{const [y,m]=k.split('-').map(Number);return {y,m:m-1}};
const lbl=k=>{const p=parse(k);return `${BULAN[p.m]} ${p.y}`};
const shift=(k,n)=>{const p=parse(k);const d=new Date(p.y,p.m+n,1);return key(d.getFullYear(),d.getMonth())};
const rp=v=>{if(v==null)return'–';const a=Math.abs(v);
  if(a>=1e9)return 'Rp '+(v/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})+' M';
  if(a>=1e5)return 'Rp '+(v/1e6).toLocaleString('id-ID',{maximumFractionDigits:a<1e7?1:0})+' jt';
  return 'Rp '+v.toLocaleString('id-ID')};
const SM=()=>window.innerWidth<720;
const srcTag=(type,txt)=>`<span class="src ${type}"><i></i>${esc(txt)}</span>`;
const status=p=>p==null?['b-mute','Tidak ditargetkan']:p>0.9?['b-ok','Tercapai']:p>0?['b-warn','Belum tercapai']:['b-bad','Belum ada capaian'];
const isPct=d=>String(d.fmt||'').startsWith('%');

/* ---------- MTT helpers ---------- */
function mttYear(y){return MTT.years[y]||null}
function lastDataMonth(){ // latest month with any achievement
  let best=null;
  for(const y of Object.keys(MTT.years)) MTT.years[y].forEach(d=>d.m.forEach((v,i)=>{if((v[3]||0)>0){const k=key(+y,i);if(!best||k>best)best=k}}));
  return best;
}

/* ================= 0. SAMPUL ================= */
function renderCover(){
  return `<div class="cover"><div><div class="k">Laporan bulanan</div></div>
    <div><h2>PASTI&#8209;Papua</h2><p class="acr">Partnership to Accelerate Stunting Reduction in Indonesia – Papua</p></div>
    <div class="per"><div><div class="lab">Bulan laporan</div><div class="m">${lbl(ST.per)}</div></div><div class="loc">Mimika, Nabire, dan Asmat</div></div></div>`;
}

function noteBlock(key,title){const it=(NOTES[key]||[]).filter(Boolean);
  return it.length?`<details class="note"><summary>${title}</summary><ul>${it.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:''}

/* ================= PENUTUP ================= */
function renderPenutup(){
  return `<div class="cover closing"><div><div class="k">Penutup</div></div>
    <div><h2>Terima kasih</h2><p class="acr">Sesi tanya jawab</p></div>
    <div class="per"><div><div class="lab">PASTI-Papua</div><div class="m sm">${lbl(ST.per)}</div></div>
      <div class="loc">Mimika, Nabire, dan Asmat</div></div></div>`;
}

/* ================= 1. MTT ================= */
function scopeInfo(m){
  const s=ST.scope;
  if(s==='bulan') return {k:'m'+m,lab:`${BULAN[m]}`,pick:d=>d.m[m]};
  if(s==='semester'){const j=m<6?0:1;return {k:'s'+j,lab:`Semester ${j+1}`,pick:d=>d.sem[j]}}
  return {k:'a',lab:'Tahunan',pick:d=>d.annual};
}
function regionChart(y,m,inds){
  const seg=`<div class="seg" role="group" aria-label="Periode grafik">${[['bulan','Bulan'],['semester','Semester'],['tahunan','Tahunan']].map(([k,t])=>`<button data-scope="${k}" aria-pressed="${ST.scope===k}">${t}</button>`).join('')}</div>`;
  const head=(meta)=>`<div class="panel-h"><h3>Capaian per wilayah</h3>${seg}</div>`;
  const RT=REGION&&REGION.target[y], RA=(REGION&&REGION.ach[y])||{};
  if(!RT) return `<div class="panel">${head()}<div class="panel-b"><div class="empty"><b>Target per wilayah belum tersedia untuk ${y}.</b>Isi sheet Target_Wilayah dan Capaian_Wilayah untuk tahun ${y}.</div></div></div>`;
  const sc=scopeInfo(m);
  const list=inds.filter(d=>(sc.pick(d)[0]||0)>0);
  if(!list.length) return `<div class="panel">${head()}<div class="panel-b"><div class="empty"><b>Tidak ada indikator yang ditargetkan.</b>Pilih periode lain.</div></div></div>`;
  const cell=(ach,tgt,isP,tot)=>{const p=tgt?ach/tgt:0;const ok=p>0.9;
    return `<div class="c${tot?' tot':''}"><div class="t"><span class="${ok?'ok':'no'}" style="width:${Math.min(p*100,100)}%"></span></div>
      <div class="v"><b class="num${ok?' ok':''}">${fP(p)}</b><span class="num">${fN(Math.round(ach))}/${fN(tgt<10?Math.round(tgt*10)/10:Math.round(tgt))}</span></div></div>`};
  let g=`<div class="h">Indikator</div>${REGION.kab.map(k=>`<div class="h">${k}</div>`).join('')}<div class="h tot">Total</div>`;
  list.forEach((d,ri)=>{
    const isP=isPct(d); const src=isP&&d.sub&&d.sub.num?d.sub.num:d;
    const v=sc.pick(src); const T=v[0]||0, A=v[3]||0;
    const sh=RT[d.code]||REGION.kab.map(()=>0); const sum=sh.reduce((a,b)=>a+b,0)||1;
    const ach=(RA[d.code]||{})[sc.k]||REGION.kab.map(()=>0);
    const last=ri===list.length-1?' last':'';
    g+=`<div class="c${last}" title="${esc(d.name)}"><span class="code">${esc(d.code.replace('IOP ',''))}</span></div>`;
    g+=sh.map((s,i)=>cell(ach[i],T*s/sum,isP).replace('class="c','class="c'+last)).join('');
    g+=cell(A,T,isP,true).replace('class="c','class="c'+last);
  });
  return `<div class="panel">${head()}<div class="panel-b"><div class="rg">${g}</div>
    <div class="legend"><span><span class="sw" style="background:var(--ink)"></span>Tercapai (&gt;90%)</span><span><span class="sw" style="background:var(--or)"></span>Belum tercapai</span><span>${sc.lab} ${y}, capaian/target</span>${FLAGS.contoh_wilayah?srcTag('sample','Rincian wilayah: data contoh'):srcTag('','Sumber: capaian per kabupaten')}</div></div></div>`;
}
function renderMTT(){
  const {y,m}=parse(ST.per); const inds=mttYear(y);
  if(!inds) return emptyPage('MTT','mtt',`Belum ada data MTT untuk tahun ${y}.`,'Isi sheet MTT_Indikator dan MTT_Data untuk tahun ini.');
  const sm=MTT.summary[y]; const [tg,ac,pc]=sm[m];
  const prevK=shift(ST.per,-1); const pp=parse(prevK); const prevS=MTT.summary[pp.y]?MTT.summary[pp.y][pp.m]:null;
  let delta='&nbsp;';
  if(prevS&&prevS[0]){const d=Math.round((pc-prevS[2])*100);delta=`${BULAN[pp.m]}: <b>${fP(prevS[2])}</b>`+(d?` (${d>0?'+':''}${d} poin)`:'');}
  const ring=(p)=>{const r=24,c=2*Math.PI*r;return `<svg class="ring" width="62" height="62" viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r="${r}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="7"/><circle cx="31" cy="31" r="${r}" fill="none" stroke="#e94e14" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*Math.min(p,1)} ${c}" transform="rotate(-90 31 31)"/></svg>`};

  const rows=sm.map((r,i)=>{const k=key(y,i);const fut=k>LAST;
    return `<tr class="${i===m?'sel':''} ${fut?'fut':''}" data-k="${k}" tabindex="0"><td>${BULAN[i]}</td><td class="r num">${fN(r[0])}</td><td class="r num">${fN(r[1])}</td><td class="r num"><div class="pbar"><span>${r[0]?fP(r[2]):'–'}</span><div class="t hide-sm"><span style="width:${Math.min((r[2]||0)*100,100)}%"></span></div></div></td></tr>`}).join('');

  const list=inds.filter(d=>(d.m[m][0]||0)>0);
  const rowsInd=list.map(d=>{
    const [t,ma,fe,to,p]=d.m[m]; const pct=isPct(d);
    const num=pct&&d.sub&&d.sub.num?d.sub.num.m[m]:null;
    const sM=pct?(num?num[1]:null):ma, sF=pct?(num?num[2]:null):fe;
    const [bc,bt]=status(p);
    const showSex=sM!=null&&sF!=null&&(sM+sF)>0;
    const A=d.annual; const ap=A[4]||0;
    const tv=pct?fP(t,1):fN(t), av=pct?fP(to,1):fN(to);
    const sex=showSex
      ?`<div class="sx-mini" role="img" aria-label="Laki-laki ${sM}, perempuan ${sF}"><div class="sexbar"><span class="m" style="width:${sM/(sM+sF)*100}%"></span><span class="f" style="width:${sF/(sM+sF)*100}%"></span></div>
         <div class="lbl"><span><span class="sw" style="background:var(--male)"></span>L <b class="num">${fN(sM)}</b></span><span><span class="sw" style="background:var(--female)"></span>P <b class="num">${fN(sF)}</b></span></div></div>`
      :`<span class="dash" title="${(sM==null&&sF==null)?'Tidak dipilah menurut jenis kelamin':'Belum ada capaian bulan ini'}">${(sM==null&&sF==null)?'Tidak dipilah':'–'}</span>`;
    const ann=`<div class="an-mini"><div class="annbar"><span style="width:${Math.min(ap*100,100)}%"></span></div>
         <div class="lbl"><span class="num">${pct?fP(A[3],1):fN(A[3])} / ${pct?fP(A[0],1):fN(A[0])}</span><b class="num">${fP(ap)}</b></div></div>`;
    return `<tr><td class="lead"><span class="code">${esc(d.code)}</span><div class="ind-n" title="Klik untuk melihat nama lengkap">${esc(d.name)}</div></td>
      <td class="r num" data-l="Target ${BLN[m]}">${tv}</td><td class="r num" data-l="Capaian"><b>${av}</b></td><td class="r num" data-l="% capaian">${fP(p)}</td>
      <td data-l="Jenis kelamin${pct&&showSex?' (pembilang)':''}">${sex}</td><td data-l="Tahunan ${y}">${ann}</td>
      <td data-l="Status"><span class="badge ${bc}">${bt}</span></td></tr>`}).join('');

  return `<div class="ph"><div><h2>Monthly Tracking Table</h2><div class="sub">${lbl(ST.per)}</div></div>${srcTag('','Sumber: MTT_Y'+String(y).slice(2)+' dan Summary_'+String(y).slice(2))}</div>
  <div class="stack-y">
  <div class="kpis">
    <div class="panel kpi lead"><div class="lab">Indikator tercapai</div><div class="val num">${tg?fP(pc):'–'}</div><div class="ctx">${delta}</div>${ring(pc||0)}</div>
    <div class="panel kpi"><div class="lab">Indikator ditargetkan</div><div class="val num">${fN(tg)}</div><div class="ctx">dari ${inds.length} indikator di MTT</div></div>
    <div class="panel kpi"><div class="lab">Indikator tercapai (&gt;90% target)</div><div class="val num">${fN(ac)} <small>/ ${fN(tg)}</small></div><div class="ctx">${tg-ac} indikator belum mencapai target</div></div>
  </div>
  <div class="row r-57">
    <div class="panel"><div class="panel-h"><h3>Ringkasan MTT ${y}</h3><span class="meta">Klik baris untuk ganti bulan</span></div>
      <div class="panel-b tw"><table class="mtt-t"><thead><tr><th>Bulan</th><th class="r">Ditargetkan</th><th class="r">Tercapai</th><th class="r">% tercapai</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    ${regionChart(y,m,inds)}
  </div>
  <div class="panel"><div class="panel-h"><h3>Indikator yang ditargetkan, ${BULAN[m]} ${y}</h3><span class="meta">${list.length} indikator. Klik nama untuk membaca lengkap.</span></div>
    <div class="panel-b tw">${rowsInd?`<table class="ind-t stack"><colgroup><col class="c-ind"><col class="c-n"><col class="c-n"><col class="c-n"><col class="c-sx"><col class="c-an"><col class="c-st"></colgroup>
      <thead><tr><th>Indikator</th><th class="r">Target ${BLN[m]}</th><th class="r">Capaian</th><th class="r">% capaian</th><th>Jenis kelamin</th><th>Tahunan ${y}</th><th>Status</th></tr></thead>
      <tbody>${rowsInd}</tbody></table>`:'<div class="empty"><b>Tidak ada indikator yang ditargetkan bulan ini.</b>Pilih bulan lain pada tabel ringkasan.</div>'}</div></div>
  </div>
  ${noteBlock('mtt','Catatan data MTT')}`;
}
function shiftMax(){return LAST}

/* ================= 2. CAPAIAN ================= */
const GRUP=[['remaja','Remaja putri'],['bumil','Ibu hamil'],['baduta','Baduta (0–23 bln)'],['balita','Balita (24–59 bln)']];
function sumReach(per){
  const d=SAMPLE.reach[per]; if(!d||(ST.kab!=='Semua'&&!d[ST.kab])) return null;
  const kabs=ST.kab==='Semua'?Object.keys(d):[ST.kab];
  const o={remaja:0,bumil:0,badutaL:0,badutaP:0,balitaL:0,balitaP:0};
  kabs.forEach(k=>{for(const g in o)o[g]+=d[k][g]});
  o.baduta=o.badutaL+o.badutaP;o.balita=o.balitaL+o.balitaP;o.total=o.remaja+o.bumil+o.baduta+o.balita;return o;
}
function sumTarget(){
  const kabs=ST.kab==='Semua'?Object.keys(SAMPLE.target):[ST.kab];
  const o={remaja:0,bumil:0,baduta:0,balita:0};kabs.forEach(k=>{for(const g in o)o[g]+=SAMPLE.target[k]?.[g]||0});
  o.total=o.remaja+o.bumil+o.baduta+o.balita;return o;
}
function renderCapaian(){
  const head=`<div class="ph"><div><h2>Total capaian penerima manfaat</h2><div class="sub">Kumulatif sampai ${lbl(ST.per)}</div></div>${FLAGS.contoh_jangkauan?srcTag('sample','Data contoh, ganti dengan BTT'):srcTag('','Sumber: rekap BTT')}</div>`;
  const kabChips=`<div class="chips" role="group" aria-label="Filter kabupaten">${['Semua','Mimika','Nabire','Asmat'].map(k=>`<button class="chip" data-kab="${k}" aria-pressed="${ST.kab===k}">${k}</button>`).join('')}</div>`;
  const r=sumReach(ST.per);
  if(!r) return head+`<div style="margin-bottom:16px">${kabChips}</div><div class="panel"><div class="empty"><b>Belum ada data capaian untuk ${lbl(ST.per)}.</b>Isi sheet Jangkauan untuk periode ${ST.per}.</div></div>`;
  const T=sumTarget();
  const sexCard=(lab,L,P,t)=>`<div class="panel kpi"><div class="lab">${lab}</div><div class="val num">${fN(L+P)} <small>/ ${fN(t)}</small></div>
     <div class="sexbar" style="margin:8px 0 6px"><span class="m" style="width:${(L/(L+P||1))*100}%"></span><span class="f" style="width:${(P/(L+P||1))*100}%"></span></div>
     <div class="split"><span><span class="sw" style="background:var(--male)"></span>Laki-laki <b class="num">${fN(L)}</b></span><span><span class="sw" style="background:var(--female)"></span>Perempuan <b class="num">${fN(P)}</b></span></div></div>`;
  const grp=GRUP.map(([g,n])=>{const v=r[g],t=T[g],p=t?v/t:0;return `<div class="grp"><div>${n}</div><div class="t"><span style="width:${Math.min(p*100,100)}%"></span></div><div class="v num"><b>${fN(v)}</b> / ${fN(t)} (${fP(p)})</div></div>`}).join('');
  // progress series: same year, months <= per
  const {y,m}=parse(ST.per); const ser=[];
  for(let i=0;i<=m;i++){const s=sumReach(key(y,i));ser.push(s?s.total:null)}
  const keg=(SAMPLE.kegiatan[ST.per]||[]).filter(k=>ST.kab==='Semua'||k.kab===ST.kab);
  const kegRows=keg.map(k=>`<tr><td class="lead">${esc(k.nama)}<div class="tag">Aktivitas ${esc(k.kode)}</div></td><td data-l="Tanggal">${esc(k.tgl)}</td><td data-l="Kabupaten">${esc(k.kab)}</td><td class="r num" data-l="Laki-laki">${fN(k.L)}</td><td class="r num" data-l="Perempuan">${fN(k.P)}</td><td class="r num" data-l="Total"><b>${fN(k.L+k.P)}</b></td></tr>`).join('');
  const tl=keg.reduce((a,k)=>a+k.L,0),tp=keg.reduce((a,k)=>a+k.P,0);
  return head+`<div style="margin-bottom:16px">${kabChips}</div>
  <div class="stack-y">
  <div class="kpis">
    <div class="panel kpi lead"><div class="lab">Total penerima manfaat dijangkau</div><div class="val num">${fN(r.total)}</div><div class="ctx"><b>${fP(r.total/T.total)}</b> dari populasi sasaran ${fN(T.total)}</div></div>
    ${sexCard('Baduta (0–23 bulan)',r.badutaL,r.badutaP,T.baduta)}
    ${sexCard('Balita (24–59 bulan)',r.balitaL,r.balitaP,T.balita)}
  </div>
  <div class="row r-11">
    <div class="panel"><div class="panel-h"><h3>Progres capaian ${y}</h3><span class="meta">Kumulatif per bulan</span></div><div class="panel-b"><div class="chart-wrap">${lineChart(ser,T.total,'Populasi sasaran',{H:250})}</div></div></div>
    <div class="panel"><div class="panel-h"><h3>Per kelompok sasaran</h3><span class="meta">Dijangkau / populasi sasaran</span></div><div class="panel-b"><div class="grps">${grp}</div></div></div>
  </div>
  <div class="panel"><div class="panel-h"><h3>Kegiatan ${BULAN[m]} ${y}</h3><span class="meta">${keg.length} kegiatan, ${fN(tl+tp)} peserta</span></div>
    <div class="panel-b tw">${keg.length?`<table class="stack"><thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Kabupaten</th><th class="r">Laki-laki</th><th class="r">Perempuan</th><th class="r">Total</th></tr></thead><tbody>${kegRows}</tbody><tfoot><tr><td colspan="3" class="lead">Total peserta</td><td class="r num" data-l="Laki-laki">${fN(tl)}</td><td class="r num" data-l="Perempuan">${fN(tp)}</td><td class="r num" data-l="Total">${fN(tl+tp)}</td></tr></tfoot></table>`:'<div class="empty"><b>Belum ada kegiatan tercatat bulan ini.</b>Isi sheet Kegiatan untuk periode ${ST.per}.</div>'}</div></div>
  </div>
  ${noteBlock('capaian','Catatan data capaian')}`;
}

/* ---------- line chart (cumulative vs reference) ---------- */
function lineChart(ser,ref,refLab,opt={}){
  const W=SM()?360:(opt.W||560),H=SM()?230:(opt.H||240),L=opt.axis?(SM()?72:68):(SM()?54:50),R=SM()?12:20,Tp=18,B=28; const n=opt.n||12; const labels=opt.labels||BLN;
  const vals=ser.filter(v=>v!=null); const plan=opt.plan||null;
  const max=Math.max(ref||0,...vals,...(plan||[0]))*1.05||1;
  const x=i=>L+(W-L-R)*(i/(n-1)); const yy=v=>Tp+(H-Tp-B)*(1-v/max);
  const fmt=opt.fmt||(v=>fN(v));
  let g='';
  [0,.5,1].forEach(f=>{const v=max/1.05*f;g+=`<line x1="${L}" x2="${W-R}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${yy(v)+4}" text-anchor="end" font-size="11" fill="var(--faint)">${opt.axis?opt.axis(v):fN(Math.round(v))}</text>`});
  labels.forEach((l,i)=>{if(i<n&&(n<=12)) g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--faint)">${l}</text>`});
  if(ref&&!plan){g+=`<line x1="${L}" x2="${W-R}" y1="${yy(ref)}" y2="${yy(ref)}" stroke="var(--ink)" stroke-dasharray="4 4"/><text x="${W-R}" y="${yy(ref)-6}" text-anchor="end" font-size="11" font-weight="600" fill="var(--mut)">${refLab} ${fmt(ref)}</text>`}
  if(plan){const pts=plan.map((v,i)=>`${x(i)},${yy(v)}`).join(' ');g+=`<polyline points="${pts}" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${x(n-1)}" y="${yy(plan[n-1])-8}" text-anchor="end" font-size="11" font-weight="600" fill="var(--mut)">${refLab}</text>`}
  const pts=ser.map((v,i)=>v==null?null:[x(i),yy(v)]).filter(Boolean);
  if(pts.length){
    g+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--or)" stroke-width="2.5" stroke-linejoin="round"/>`;
    pts.forEach(p=>g+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--or)" stroke="var(--card)" stroke-width="1.5"/>`);
    const lp=pts[pts.length-1], lv=vals[vals.length-1];
    g+=`<text x="${lp[0]}" y="${lp[1]-10}" text-anchor="${lp[0]>W-90?'end':'middle'}" font-size="12.5" font-weight="800" fill="var(--ink)">${fmt(lv)}</text>`;
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik progres">${g}</svg>`;
}

/* ================= 3. ANGGARAN ================= */
function fyOf(k){const p=parse(k);return (p.m+1)>=ANGGARAN_CFG.fyStartMonth?p.y+1:p.y}
function fyMonths(fy){const s=ANGGARAN_CFG.fyStartMonth;const a=[];for(let i=0;i<12;i++){const d=new Date(fy-1,s-1+i,1);a.push(key(d.getFullYear(),d.getMonth()))}return a}
function renderAnggaran(){
  const fy=fyOf(ST.per);
  const head=`<div class="ph"><div><h2>Anggaran dan burn rate</h2><div class="sub">FY${String(fy).slice(2)} (${lbl(fyMonths(fy)[0])} – ${lbl(fyMonths(fy)[11])}), realisasi sampai ${lbl(ST.per)}</div></div>${FLAGS.contoh_anggaran?srcTag('sample','Data contoh, ganti dengan laporan keuangan'):srcTag('','Sumber: laporan keuangan')}</div>`;
  const fbar=budgetFilter(fy);
  const pos=SAMPLE.budget.filter(b=>b.fy===fy);
  if(!pos.length) return head+fbar+`<div class="panel"><div class="empty"><b>Belum ada data anggaran FY${String(fy).slice(2)}.</b>Isi sheet Anggaran dengan fy = ${fy}.</div></div>`;
  const ms=fyMonths(fy); const upto=ms.indexOf(ST.per); const ytdMs=ms.slice(0,upto+1);
  const lines=pos.map(b=>{const ytd=ytdMs.reduce((a,k)=>a+(b.realisasi[k]||0),0);const p=b.anggaran?ytd/b.anggaran:0;
    return {...b,ytd,p,sisa:b.anggaran-ytd,st:p>=0.9?'Terserap':p>0?'Sebagian':'Belum terserap'}});
  const A=lines.reduce((a,b)=>a+b.anggaran,0), Y=lines.reduce((a,b)=>a+b.ytd,0);
  const br=Y/A, exp=(upto+1)/12;
  const cum=[];let c=0;ms.forEach((k,i)=>{c+=pos.reduce((a,b)=>a+(b.realisasi[k]||0),0);cum.push(i<=upto?c:null)});
  const plan=ms.map((k,i)=>A*(i+1)/12);
  const cnt={Semua:lines.length,Terserap:0,Sebagian:0,'Belum terserap':0};lines.forEach(l=>cnt[l.st]++);
  const show=lines.filter(l=>ST.bud==='Semua'||l.st===ST.bud);
  const stc={Terserap:'b-ok',Sebagian:'b-warn','Belum terserap':'b-bad'};
  const rows=show.map(l=>`<tr><td class="num hide-sm">${esc(l.kode)}</td><td class="lead"><span class="tag" style="font-size:12px">${SM()?esc(l.kode)+' ':''}</span>${esc(l.nama)}</td><td class="r num" data-l="Anggaran tahunan">${rp(l.anggaran)}</td><td class="r num" data-l="Realisasi YTD">${rp(l.ytd)}</td><td class="r num" data-l="Serapan"><div class="pbar"><span>${fP(l.p)}</span><div class="t hide-sm"><span style="width:${Math.min(l.p*100,100)}%"></span></div></div></td><td class="r num" data-l="Sisa">${rp(l.sisa)}</td><td data-l="Status"><span class="st ${stc[l.st]}">${l.st}</span></td></tr>`).join('');
  const sA=show.reduce((a,b)=>a+b.anggaran,0),sY=show.reduce((a,b)=>a+b.ytd,0);
  const gapPts=Math.round((br-exp)*100);
  return head+`<div class="stack-y">${fbar}<div class="kpis k4">
    <div class="panel kpi lead"><div class="lab">Burn rate YTD</div><div class="val num">${fP(br)}</div><div class="ctx">Seharusnya ${fP(exp)} (${upto+1} dari 12 bulan), selisih <b>${gapPts>=0?'+':''}${gapPts} poin</b></div></div>
    <div class="panel kpi"><div class="lab">Anggaran tahunan FY${String(fy).slice(2)}</div><div class="val num">${rp(A)}</div><div class="ctx">${lines.length} pos anggaran</div></div>
    <div class="panel kpi"><div class="lab">Realisasi YTD</div><div class="val num">${rp(Y)}</div><div class="ctx">Bulan ini ${rp(pos.reduce((a,b)=>a+(b.realisasi[ST.per]||0),0))}</div></div>
    <div class="panel kpi"><div class="lab">Sisa anggaran tahunan</div><div class="val num">${rp(A-Y)}</div><div class="ctx">${fP(1-br)} belum terserap</div></div>
  </div>
  <div class="panel"><div class="panel-h"><h3>Realisasi kumulatif dan rencana</h3><span class="meta">Garis putus-putus: serapan merata per bulan</span></div>
    <div class="panel-b">${lineChart(cum,null,'Rencana',{plan,W:1100,H:280,labels:ms.map(k=>BLN[parse(k).m]),fmt:rp,axis:v=>rp(v)})}</div></div>
  <div class="panel"><div class="panel-h"><h3>Serapan per aktivitas</h3>
     <div class="chips" role="group" aria-label="Filter status serapan">${['Semua','Belum terserap','Sebagian','Terserap'].map(s=>`<button class="chip" data-bud="${s}" aria-pressed="${ST.bud===s}">${s} (${cnt[s]})</button>`).join('')}</div></div>
    <div class="panel-b tw"><table class="stack"><thead><tr><th>Kode</th><th>Aktivitas</th><th class="r">Anggaran tahunan</th><th class="r">Realisasi YTD</th><th class="r">Serapan</th><th class="r">Sisa</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td class="hide-sm"></td><td class="lead">Total (${show.length} pos)</td><td class="r num" data-l="Anggaran tahunan">${rp(sA)}</td><td class="r num" data-l="Realisasi YTD">${rp(sY)}</td><td class="r num" data-l="Serapan">${fP(sA?sY/sA:0)}</td><td class="r num" data-l="Sisa">${rp(sA-sY)}</td><td></td></tr></tfoot></table></div></div></div>
  ${noteBlock('anggaran','Catatan data anggaran')}`;
}

/* filter bulan khusus halaman anggaran (tetap terlihat saat layar penuh) */
function budgetFilter(fy){
  const ms=fyMonths(fy);
  const btn=ms.map(k=>{const ok=PERIODS.includes(k);const sel=k===ST.per;const ytd=ok&&k<ST.per;
    return `<button data-k="${k}" aria-pressed="${sel}" class="${ytd?'ytd':''}" ${ok?'':'disabled'} title="${lbl(k)}">${BLN[parse(k).m]}</button>`}).join('');
  const has=d=>fyMonths(fy+d).some(k=>PERIODS.includes(k));
  return `<div class="panel fbar"><div class="fb-l"><span class="fb-lab">Bulan</span><div class="mseg" role="group" aria-label="Pilih bulan">${btn}</div></div>
    <div class="fb-r"><button class="arr sm" data-fy="-1" aria-label="Tahun fiskal sebelumnya" ${has(-1)?'':'disabled'}>‹</button><b>FY${String(fy).slice(2)}</b><button class="arr sm" data-fy="1" aria-label="Tahun fiskal berikutnya" ${has(1)?'':'disabled'}>›</button></div></div>`;
}
function shiftFY(d){const tgt=shift(ST.per,12*d);const fy=fyOf(tgt);
  const k=PERIODS.includes(tgt)?tgt:fyMonths(fy).filter(x=>PERIODS.includes(x)).slice(d>0?0:-1)[0];if(k)setPer(k)}

/* ================= 4. HIGHLIGHT ================= */
const camIcon=`<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
function renderHighlight(){
  const items=KONTEN.highlight[ST.per]||[];
  const head=`<div class="ph"><div><h2>Highlight kegiatan</h2><div class="sub">${lbl(ST.per)}</div></div>${FLAGS.contoh_highlight?srcTag('sample','Data contoh, ganti foto dan keterangan'):srcTag('','Sumber: dokumentasi kegiatan')}</div>`;
  if(!items.length) return head+`<div class="panel"><div class="empty"><b>Belum ada highlight untuk ${lbl(ST.per)}.</b>Isi sheet Highlight dengan periode <code>${ST.per}</code>.</div></div>`;
  ST.slide=Math.min(ST.slide,items.length-1);
  const slides=items.map((h,i)=>`<article class="slide" aria-roledescription="slide" aria-label="${i+1} dari ${items.length}">
     <div class="ph-img">${h.foto?`<img src="${esc(h.foto)}" alt="${esc(h.judul)}">`:`<div class="ph-empty">${camIcon}Foto belum ditambahkan</div>`}</div>
     <div class="slide-b"><span class="code" style="align-self:flex-start">Aktivitas ${esc(h.kode)}</span><h3>${esc(h.judul)}</h3>
       <div class="m"><span>${esc(h.tanggal)}</span><span>${esc(h.lokasi)}</span></div><p>${esc(h.ket)}</p></div></article>`).join('');
  return head+`<div class="car" id="car" tabindex="0" aria-roledescription="carousel" aria-label="Highlight kegiatan">
    <div class="car-vp"><div class="car-tr" id="cartr" style="transform:translateX(-${ST.slide*100}%)">${slides}</div></div>
    <div class="car-nav"><div class="dots">${items.map((_,i)=>`<button data-sl="${i}" aria-label="Slide ${i+1}" aria-current="${i===ST.slide}"></button>`).join('')}</div>
    <div class="arrows"><button class="arr" data-mv="-1" aria-label="Sebelumnya" ${ST.slide===0?'disabled':''}>‹</button><span class="cnt num">${ST.slide+1} / ${items.length}</span><button class="arr" data-mv="1" aria-label="Berikutnya" ${ST.slide===items.length-1?'disabled':''}>›</button></div></div></div>`;
}
function goSlide(i){const n=(KONTEN.highlight[ST.per]||[]).length;if(!n)return;ST.slide=Math.max(0,Math.min(n-1,i));
  const tr=document.getElementById('cartr');if(!tr){render();return}
  tr.style.transform=`translateX(-${ST.slide*100}%)`;
  document.querySelectorAll('#car .dots button').forEach((b,k)=>b.setAttribute('aria-current',k===ST.slide));
  const [pv,nx]=document.querySelectorAll('#car .arr');pv.disabled=ST.slide===0;nx.disabled=ST.slide===n-1;
  document.querySelector('#car .cnt').textContent=`${ST.slide+1} / ${n}`;}

/* ================= 5. TANTANGAN ================= */
const srcLab={handover:'Dari file handover',mtt:'Dari MTT','':''};
function renderTantangan(){
  const items=KONTEN.tantangan[ST.per]||[];
  const head=`<div class="ph"><div><h2>Tantangan dan dukungan</h2><div class="sub">${lbl(ST.per)}</div></div>${FLAGS.draf_tantangan?srcTag('draft','Draf, perlu dikonfirmasi tim'):srcTag('','Disepakati tim')}</div>`;
  if(!items.length) return head+`<div class="panel"><div class="empty"><b>Belum ada tantangan untuk ${lbl(ST.per)}.</b>Isi sheet Tantangan dengan periode <code>${ST.per}</code>.</div></div>`;
  return head+`<div class="panel"><div class="panel-b tw"><table class="stack"><thead><tr><th style="width:36px">No</th><th>Tantangan</th><th>Dukungan yang dibutuhkan</th><th>Pendukung</th></tr></thead><tbody>
   ${items.map((t,i)=>`<tr><td class="num hide-sm">${i+1}</td><td class="lead">${esc(t.tantangan)}${t.sumber?`<div class="tag">${srcLab[t.sumber]||''}</div>`:''}</td><td data-l="Dukungan">${esc(t.dukungan)}</td><td data-l="Pendukung"><b>${esc(t.pendukung)}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ================= 6. RENCANA ================= */
function renderRencana(){
  const nx=shift(ST.per,1); const {y,m}=parse(nx); const inds=mttYear(y);
  const items=KONTEN.rencana[nx]||[];
  const head=`<div class="ph"><div><h2>Rencana kerja ${lbl(nx)}</h2><div class="sub">Bulan setelah ${lbl(ST.per)}</div></div>${FLAGS.draf_rencana?srcTag('draft','Draf, perlu dikonfirmasi tim'):srcTag('','Disepakati tim')}</div>`;
  let strip='';
  if(inds){const t=inds.filter(d=>(d.m[m][0]||0)>0);
    strip=`<div class="panel"><div class="panel-h"><h3>Target MTT ${BULAN[m]} ${y}</h3>${srcTag('','Sumber: MTT_Y'+String(y).slice(2))}</div><div class="panel-b"><div class="next-strip">${t.length?t.map(d=>`<div class="nt" title="${esc(d.name)}"><span class="tag">${esc(d.code)}</span><b class="num">${isPct(d)?fP(d.m[m][0],1):fN(d.m[m][0])}</b>${esc(d.unit||'')}</div>`).join(''):'<span class="tag">Tidak ada indikator yang ditargetkan.</span>'}</div></div></div><div style="height:16px"></div>`}
  const tbl=items.length?`<table class="stack"><thead><tr><th style="width:36px">No</th><th>Kegiatan</th><th>Waktu</th><th>Lokasi</th><th>PIC</th><th>Hasil yang diharapkan</th></tr></thead><tbody>
   ${items.map((r,i)=>`<tr><td class="num hide-sm">${i+1}</td><td class="lead">${esc(r.kegiatan)}${r.sumber?`<div class="tag">${srcLab[r.sumber]||''}</div>`:''}</td><td data-l="Waktu" style="white-space:nowrap">${esc(r.waktu)}</td><td data-l="Lokasi">${esc(r.lokasi)}</td><td data-l="PIC">${esc(r.pic)}</td><td data-l="Hasil">${esc(r.ket)}</td></tr>`).join('')}</tbody></table>`
   :`<div class="empty"><b>Belum ada rencana kerja untuk ${lbl(nx)}.</b>Isi sheet Rencana dengan periode_rencana <code>${nx}</code>.</div>`;
  return head+strip+`<div class="panel"><div class="panel-h"><h3>Kegiatan</h3><span class="meta">${items.length} kegiatan</span></div><div class="panel-b tw">${tbl}</div></div>`;
}

function emptyPage(t,id,b,s){return `<div class="ph"><div><h2>${t}</h2></div></div><div class="panel"><div class="empty"><b>${b}</b>${s}</div></div>`}

/* =====================================================================
   SUMBER DATA: GOOGLE SHEET
   - SHEET_ID diisi di bagian KONFIGURASI (atas file) atau lewat ?sheet=<ID>.
   - Aktivasi publik hanya setelah persetujuan cakupan data; sumber harus dapat dibaca.
   - Gagal sinkronisasi ditandai jelas; snapshot valid terakhir dipertahankan.
   ===================================================================== */
const SHEETS_REQUIRED=['Pengaturan','MTT_Indikator','MTT_Data','MTT_Ringkasan'];
const SHEETS_OPTIONAL=['Target_Wilayah','Capaian_Wilayah','Populasi_Sasaran','Jangkauan','Kegiatan','Anggaran','Highlight','Tantangan','Rencana','Catatan'];
const EMBEDDED=JSON.parse(JSON.stringify({MTT,REGION,SAMPLE,KONTEN,NOTES,FLAGS,ANGGARAN_CFG}));
const DATA_STATE={src:'embedded',at:null,warn:[]};

function sheetId(){const q=new URLSearchParams(location.search).get('sheet');return (q||SHEET_ID||'').trim()}
function gvizUrl(id,name){return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&tq=select%20*%20options%20no_format&headers=1&sheet=${encodeURIComponent(name)}&t=${Date.now()}`}

/* CSV parser (tanda kutip, koma, dan baris baru di dalam sel) */
function parseCSV(txt){
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<txt.length;i++){const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===','){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&txt[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}
    else f+=c}
  if(f!==''||row.length){row.push(f);rows.push(row)}
  if(q)throw new Error('CSV: kutip tidak ditutup');if(!rows.length)throw new Error('CSV kosong');
  const head=rows[0].map(h=>h.trim().toLowerCase());
  if(head.some(h=>['__proto__','prototype','constructor'].includes(h))||new Set(head.filter(Boolean)).size!==head.filter(Boolean).length)throw new Error('CSV: header tidak aman/duplikat');
  const data=rows.slice(1).filter(r=>r.some(v=>v.trim()!=='')).map(r=>{const o={};head.forEach((h,i)=>{if(h)o[h]=(r[i]??'').trim()});return o});Object.defineProperty(data,'headers',{value:head});return data;
}
/* angka: kosong -> null; menerima titik atau koma desimal, tanda %, spasi */
function num(v){
  if(v==null)return null;let s=String(v).replace(/[\s\u00a0]/g,'');if(s===''||s==='-'||s==='–')return null;
  let pct=false;if(s.endsWith('%')){pct=true;s=s.slice(0,-1)}
  if(s.includes('.')&&s.includes(',')){if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'')}
  else if(s.includes(','))s=s.replace(',','.');
  const n=Number(s);if(!isFinite(n))return null;return pct?n/100:n;
}
/* periode: '2026-09', '2026-9', '2026-09-01', '9/1/2026' -> '2026-09' */
function per(v){
  const s=String(v||'').trim();let m=s.match(/^(\d{4})[-/.](\d{1,2})/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}`;
  m=s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);if(m)return `${m[3]}-${m[1].padStart(2,'0')}`;
  return s;
}
const yes=v=>/^(ya|yes|y|true|1)$/i.test(String(v||'').trim());
const byOrder=(a,b)=>(num(a.urutan)??0)-(num(b.urutan)??0);
function group(rows,k){const o=Object.create(null);rows.forEach(r=>{(o[r[k]]=o[r[k]]||[]).push(r)});return o}

/* ---- ubah isi sheet menjadi struktur yang dipakai dashboard ---- */
function buildFromSheets(S){
  const cfg=Object.create(null);(S.Pengaturan||[]).forEach(r=>cfg[r.kunci]=r.nilai);
  const out={FLAGS:{},ANGGARAN_CFG:{...ANGGARAN_CFG}};
  ['contoh_wilayah','contoh_jangkauan','contoh_anggaran','contoh_highlight','draf_tantangan','draf_rencana'].forEach(k=>out.FLAGS[k]=k in cfg?yes(cfg[k]):false);
  if(num(cfg.fy_mulai_bulan))out.ANGGARAN_CFG.fyStartMonth=num(cfg.fy_mulai_bulan);

  /* MTT */
  const empty=()=>[null,null,null,null,null];
  const vals=r=>[num(r.target),num(r.laki_laki),num(r.perempuan),num(r.total),num(r.persen_capaian)];
  const slot=()=>({m:Array.from({length:12},empty),sem:[empty(),empty()],annual:empty()});
  const years={};
  S.MTT_Indikator.slice().sort(byOrder).forEach(r=>{const y=num(r.tahun);if(!y)return;
    (years[y]=years[y]||[]).push({code:r.kode,name:r.nama_indikator,agg:r.agregasi,fmt:r.format,unit:r.satuan,...slot(),sub:{}})});
  S.MTT_Data.forEach(r=>{const y=num(r.tahun);const d=(years[y]||[]).find(x=>x.code===r.kode);if(!d)return;
    let t=d;if(/^pembilang$/i.test(r.baris))t=d.sub.num=d.sub.num||slot();else if(/^penyebut$/i.test(r.baris))t=d.sub.den=d.sub.den||slot();
    const p=String(r.periode||'').toUpperCase().trim();const v=vals(r);
    if(/^M\d{1,2}$/.test(p))t.m[+p.slice(1)-1]=v;else if(p==='S1')t.sem[0]=v;else if(p==='S2')t.sem[1]=v;else if(p==='TAHUN')t.annual=v});
  const summary={};Object.keys(years).forEach(y=>summary[y]=Array.from({length:12},()=>[0,0,0]));
  S.MTT_Ringkasan.forEach(r=>{const y=num(r.tahun),b=num(r.bulan);if(summary[y]&&b>=1&&b<=12)summary[y][b-1]=[num(r.ditargetkan)||0,num(r.tercapai)||0,num(r.persen)||0]});
  out.MTT={years,summary};

  /* wilayah */
  if(S.Target_Wilayah){
    const fixed=['tahun','kode','total'];const kab=Object.keys(S.Target_Wilayah[0]||{}).filter(h=>!fixed.includes(h));
    const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
    const R={kab:kab.map(cap),target:{},ach:{}};
    S.Target_Wilayah.forEach(r=>{const y=num(r.tahun);if(!y)return;(R.target[y]=R.target[y]||{})[r.kode]=kab.map(k=>num(r[k])||0)});
    const PK=p=>{p=String(p||'').toUpperCase();if(/^M\d{1,2}$/.test(p))return 'm'+(+p.slice(1)-1);return {S1:'s0',S2:'s1',TAHUN:'a'}[p]};
    (S.Capaian_Wilayah||[]).forEach(r=>{const y=num(r.tahun),k=PK(r.periode);if(!y||!k)return;
      const A=(R.ach[y]=R.ach[y]||{});(A[r.kode]=A[r.kode]||{})[k]=kab.map(x=>num(r[x])||0)});
    out.REGION=R;
  }
  /* jangkauan dan kegiatan */
  const SM={target:{},reach:{},kegiatan:{},budget:[]};
  if(S.Populasi_Sasaran){SM.target={};S.Populasi_Sasaran.forEach(r=>SM.target[r.kabupaten]={remaja:num(r.remaja_putri)||0,bumil:num(r.ibu_hamil)||0,baduta:num(r.baduta)||0,balita:num(r.balita)||0})}
  if(S.Jangkauan){SM.reach={};S.Jangkauan.forEach(r=>{const p=per(r.periode);(SM.reach[p]=SM.reach[p]||{})[r.kabupaten]={remaja:num(r.remaja_putri)||0,bumil:num(r.ibu_hamil)||0,badutaL:num(r.baduta_laki)||0,badutaP:num(r.baduta_perempuan)||0,balitaL:num(r.balita_laki)||0,balitaP:num(r.balita_perempuan)||0}})}
  if(S.Kegiatan){SM.kegiatan={};const g=group(S.Kegiatan.map(r=>({...r,periode:per(r.periode)})),'periode');
    for(const p in g)SM.kegiatan[p]=g[p].sort(byOrder).map(r=>({nama:r.nama_kegiatan,kode:r.kode_aktivitas,tgl:r.tanggal,kab:r.kabupaten,L:num(r.laki_laki)||0,P:num(r.perempuan)||0}))}
  if(S.Anggaran){const sm=out.ANGGARAN_CFG.fyStartMonth;
    SM.budget=S.Anggaran.filter(r=>num(r.fy)).map(r=>{const fy=num(r.fy);const ms=[];for(let i=0;i<12;i++){const d=new Date(fy-1,sm-1+i,1);ms.push(key(d.getFullYear(),d.getMonth()))}
      const real={};Object.keys(r).forEach(h=>{const m=h.match(/^m(\d{2})/);if(m){const v=num(r[h]);if(v!=null)real[ms[+m[1]-1]]=v}});
      return {fy,kode:r.kode,nama:r.aktivitas,anggaran:num(r.anggaran_tahunan)||0,realisasi:real}})}
  out.SAMPLE=SM;

  /* konten bulanan */
  const KN={highlight:{},tantangan:{},rencana:{}};
  const per_group=(rows,pk,map)=>{const o={};const g=group(rows.map(r=>({...r,_p:per(r[pk])})),'_p');for(const p in g)o[p]=g[p].sort(byOrder).map(map);return o};
  if(S.Highlight)KN.highlight=per_group(S.Highlight,'periode',r=>({judul:r.judul,tanggal:r.tanggal,lokasi:r.lokasi,kode:r.kode_aktivitas,ket:r.keterangan,foto:safePhoto(r.foto_url)}));
  if(S.Tantangan)KN.tantangan=per_group(S.Tantangan,'periode',r=>({tantangan:r.tantangan,dukungan:r.dukungan,pendukung:r.pendukung,sumber:r.sumber==='baru'?'':(r.sumber||'')}));
  if(S.Rencana)KN.rencana=per_group(S.Rencana,'periode_rencana',r=>({kegiatan:r.kegiatan,waktu:r.waktu,lokasi:r.lokasi,pic:r.pic,ket:r.hasil,sumber:r.sumber==='baru'?'':(r.sumber||'')}));
  out.KONTEN=KN;
  if(S.Catatan){const N={mtt:[],capaian:[],anggaran:[]};S.Catatan.slice().sort(byOrder).forEach(r=>{const h=String(r.halaman||'').toLowerCase();if(N[h]&&r.catatan)N[h].push(r.catatan)});out.NOTES=N}
  return out;
}

// All fourteen tabs form one snapshot; never mix live data and embedded demo data.
const SCHEMA={
 Pengaturan:['kunci','nilai','keterangan'],
 MTT_Indikator:['tahun','urutan','kode','nama_indikator','agregasi','format','satuan'],
 MTT_Data:['tahun','kode','baris','periode','target','laki_laki','perempuan','total','persen_capaian'],
 MTT_Ringkasan:['tahun','bulan','nama_bulan','ditargetkan','tercapai','persen'],
 Target_Wilayah:['tahun','kode','mimika','nabire','asmat','total'],
 Capaian_Wilayah:['tahun','kode','baris','periode','mimika','nabire','asmat','total','total_mtt','cek'],
 Populasi_Sasaran:['kabupaten','remaja_putri','ibu_hamil','baduta','balita','total'],
 Jangkauan:['periode','kabupaten','remaja_putri','ibu_hamil','baduta_laki','baduta_perempuan','balita_laki','balita_perempuan','total'],
 Kegiatan:['periode','urutan','nama_kegiatan','kode_aktivitas','tanggal','kabupaten','laki_laki','perempuan','total'],
 Anggaran:['fy','kode','aktivitas','anggaran_tahunan',...Array.from({length:12},(_,i)=>['m01_okt','m02_nov','m03_des','m04_jan','m05_feb','m06_mar','m07_apr','m08_mei','m09_jun','m10_jul','m11_agu','m12_sep'][i]),'realisasi_total'],
 Highlight:['periode','urutan','judul','tanggal','lokasi','kode_aktivitas','keterangan','foto_url'],
 Tantangan:['periode','urutan','tantangan','dukungan','pendukung','sumber'],
 Rencana:['periode_rencana','urutan','kegiatan','waktu','lokasi','pic','hasil','sumber'],
 Catatan:['halaman','urutan','catatan']
};
const NUMERIC=new Set(['tahun','urutan','fy','bulan','target','laki_laki','perempuan','total','persen_capaian','ditargetkan','tercapai','persen','mimika','nabire','asmat','total_mtt','remaja_putri','ibu_hamil','baduta','balita','baduta_laki','baduta_perempuan','balita_laki','balita_perempuan','anggaran_tahunan','realisasi_total']);
const BAD_KEYS=new Set(['__proto__','prototype','constructor']);
function safePhoto(value){
 const s=String(value||'').trim();if(!s)return '';
 try{const u=new URL(s,location.href);return u.protocol==='https:'||u.origin===location.origin&&u.protocol==='http:'?s:''}catch{return ''}
}
function validateSheets(S){
 for(const [name,headers] of Object.entries(SCHEMA)){
  const rows=S[name];if(!rows)throw new Error(name+': tab tidak tersedia');
  const actual=rows.headers||Object.keys(rows[0]||{});
  const allowed=name==='Anggaran'?[...headers,'sisa','serapan']:headers;
  if(headers.some(h=>!actual.includes(h))||actual.some(h=>h&&!allowed.includes(h)))throw new Error(name+': kolom wajib tidak lengkap atau kolom tidak dikenal');
  for(const r of rows){
   for(const k of ['tahun','kode','kabupaten','periode','periode_rencana','kunci'])if(headers.includes(k)&&!r[k])throw new Error(name+': '+k+' kosong');
   for(const [h,v] of Object.entries(r)){
    if(BAD_KEYS.has(v)||BAD_KEYS.has(h))throw new Error(name+': nilai kunci tidak aman');
    if(['sisa','serapan'].includes(h)&&v!==''&&(num(v)===null||(h==='serapan'&&num(v)<0)))throw new Error(name+': angka tidak valid di '+h);
    if((NUMERIC.has(h)||/^m\d{2}_/.test(h))&&v!==''&&v!=='-'&&v!=='–'&&(num(v)===null||num(v)<0))throw new Error(name+': angka tidak valid di '+h);
   }
   if(r.tahun&&(!Number.isInteger(num(r.tahun))||num(r.tahun)<2000||num(r.tahun)>2100))throw new Error(name+': tahun tidak valid');
   if(r.bulan&&(!Number.isInteger(num(r.bulan))||num(r.bulan)<1||num(r.bulan)>12))throw new Error(name+': bulan tidak valid');
   if(['MTT_Data','Capaian_Wilayah'].includes(name)&&!(/^(M0?[1-9]|M1[0-2]|S[12]|TAHUN)$/i.test(r.periode)))throw new Error(name+': periode tidak valid');
   if(['MTT_Data','Capaian_Wilayah'].includes(name)&&!(/^(Utama|Pembilang|Penyebut)$/i.test(r.baris)))throw new Error(name+': baris tidak valid');
   if(['Jangkauan','Kegiatan','Highlight','Tantangan','Rencana'].includes(name)&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(per(r.periode||r.periode_rencana)))throw new Error(name+': periode bulanan tidak valid');
  }
 }
 const ids=new Set();for(const r of S.MTT_Indikator){const k=r.tahun+'|'+r.kode;if(!r.kode||ids.has(k))throw new Error('MTT_Indikator: kode kosong/duplikat');ids.add(k)}
 const keys=new Set();for(const r of S.MTT_Data){const k=[r.tahun,r.kode,r.baris.toLowerCase(),r.periode.toUpperCase()].join('|');if(!ids.has(r.tahun+'|'+r.kode)||keys.has(k))throw new Error('MTT_Data: referensi/duplikat tidak valid');keys.add(k)}
 const counties=new Set(['Mimika','Nabire','Asmat']);const population=new Set();
 for(const r of S.Populasi_Sasaran){if(!counties.has(r.kabupaten)||population.has(r.kabupaten))throw new Error('Populasi_Sasaran: kabupaten tidak valid/duplikat');population.add(r.kabupaten)}
 for(const r of S.Jangkauan)if(!population.has(r.kabupaten))throw new Error('Jangkauan: populasi sasaran tidak tersedia');
 if(!ids.size||!S.MTT_Data.length)throw new Error('Sheet MTT kosong');
 const cfg=Object.fromEntries(S.Pengaturan.map(r=>[r.kunci,r.nilai]));
 for(const k of ['contoh_wilayah','contoh_jangkauan','contoh_anggaran','contoh_highlight','draf_tantangan','draf_rencana'])if(!/^(ya|yes|y|true|1|tidak|no|n|false|0)$/i.test(cfg[k]||''))throw new Error('Pengaturan: flag '+k+' wajib diisi');
 if(!Number.isInteger(num(cfg.fy_mulai_bulan))||num(cfg.fy_mulai_bulan)<1||num(cfg.fy_mulai_bulan)>12)throw new Error('Pengaturan: bulan fiskal tidak valid');
 return S;
}
let syncFlight=null,syncSignature='',pendingSnapshot=null;
function applySnapshot(D,signature){
 if(document.body.classList.contains('present')){pendingSnapshot={D,signature};return}
 if(signature!==syncSignature){
  const scroll=[window.scrollX,window.scrollY];const opened=[...document.querySelectorAll('.ind-n.open')].map(e=>e.textContent);
  const previous={MTT,REGION,SAMPLE,KONTEN,FLAGS,ANGGARAN_CFG,NOTES},state={...ST};
  try{
   ({MTT,REGION,SAMPLE,KONTEN,FLAGS,ANGGARAN_CFG,NOTES}=D);
   ST.slide=Math.min(ST.slide,Math.max(0,(KONTEN.highlight[ST.per]||[]).length-1));
   setupPeriods(false);render();
  }catch(e){({MTT,REGION,SAMPLE,KONTEN,FLAGS,ANGGARAN_CFG,NOTES}=previous);Object.assign(ST,state);setupPeriods(false);render();throw e}
  document.querySelectorAll('.ind-n').forEach(e=>{if(opened.includes(e.textContent))e.classList.add('open')});window.scrollTo(...scroll);
  syncSignature=signature;
 }
 pendingSnapshot=null;
}
function flushSnapshot(){if(pendingSnapshot)applySnapshot(pendingSnapshot.D,pendingSnapshot.signature);setDataBadge()}
async function loadSheet(){
 if(syncFlight)return syncFlight;
 const id=sheetId();if(!id){setDataBadge();return}
 DATA_STATE.src='loading';DATA_STATE.warn=[];setDataBadge();
 syncFlight=(async()=>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   if(!/^[A-Za-z0-9_-]{20,100}$/.test(id))throw new Error('ID Google Sheet tidak valid');
   const S=Object.create(null);
   await Promise.all(Object.keys(SCHEMA).map(async name=>{
    const response=await fetch(gvizUrl(id,name),{cache:'no-store',credentials:'omit',signal:controller.signal});
    if(!response.ok)throw new Error(name+': HTTP '+response.status);
    const t=await response.text();if(/^\s*</.test(t)||t.length>2000000)throw new Error(name+': respons bukan CSV atau terlalu besar');
    S[name]=parseCSV(t);
   }));
   validateSheets(S);const signature=JSON.stringify(S);const D=buildFromSheets(S);
   applySnapshot(D,signature);DATA_STATE.src='sheet';DATA_STATE.at=new Date();
  }catch(e){controller.abort();DATA_STATE.src='error';DATA_STATE.warn=[e.name==='AbortError'?'Koneksi melewati batas waktu':String(e.message||e)];console.warn('Sinkronisasi Google Sheet gagal');}
  finally{clearTimeout(timeout);setDataBadge();syncFlight=null}
 })();return syncFlight;
}
function setDataBadge(){
 const el=$('#dataSrc');if(!el)return;
 const stale=DATA_STATE.at&&Date.now()-DATA_STATE.at.getTime()>120000;
 const t=DATA_STATE.at?DATA_STATE.at.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'';
 const map={embedded:['','Data bawaan'],loading:['draft','Memuat Google Sheet…'],sheet:['',pendingSnapshot?'Pembaruan siap setelah presentasi':'Data: Google Sheet, dimuat '+t],error:['sample',DATA_STATE.at?'Sinkronisasi gagal · data terakhir '+t:'Koneksi gagal · data bawaan belum terverifikasi']};
 const [c,txt]=map[DATA_STATE.src];el.className='src '+(stale?'sample':c);el.replaceChildren(document.createElement('i'),document.createTextNode(stale?'Data lama · terakhir '+t:txt));
 el.title=[...DATA_STATE.warn,'Klik atau Enter untuk refresh; otomatis setiap 60 detik.'].join('\n');
}
function startSync(){
 const el=$('#dataSrc');el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Status data; refresh Google Sheet');
 el.addEventListener('click',()=>loadSheet());el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();loadSheet()}});
 setInterval(()=>{setDataBadge();if(!document.hidden)loadSheet()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadSheet()});window.addEventListener('online',()=>loadSheet());
 new MutationObserver(()=>{if(!document.body.classList.contains('present'))flushSnapshot()}).observe(document.body,{attributes:true,attributeFilter:['class']});
 loadSheet();
}
/* daftar bulan di pilihan header mengikuti tahun yang ada di MTT */
function setupPeriods(first){
  LAST=lastDataMonth();
  const ks=[];Object.keys(MTT.years).sort().forEach(y=>{for(let i=0;i<12;i++)ks.push(key(+y,i))});
  PERIODS=ks;
  $('#per').innerHTML=ks.slice().reverse().map(k=>`<option value="${k}">${lbl(k)}</option>`).join('');
  if(first||!ks.includes(ST.per))ST.per=LAST||ks[ks.length-1];
  $('#per').value=ST.per;
}

/* ================= shell ================= */
const R={penutup:renderPenutup,cover:renderCover,mtt:renderMTT,capaian:renderCapaian,anggaran:renderAnggaran,highlight:renderHighlight,tantangan:renderTantangan,rencana:renderRencana};
function render(){
  $('#tabs').innerHTML=SECTIONS.map(s=>{const n=NUM(s.id);return `<button class="tab" role="tab" data-sec="${s.id}" aria-selected="${ST.sec===s.id}">${n?`<span class="n">${n}</span>`:''}${s.t}</button>`}).join('');
  $('#main').innerHTML=SECTIONS.map(s=>{let h=R[s.id]();const k=NUM(s.id);
    if(k>0)h=h.replace(/^<div class="ph"><div>([\s\S]*?<\/div>)<\/div>/,(m,inner)=>`<div class="ph pg-head"><div class="pg-l"><span class="pg-num">${String(k).padStart(2,'0')}</span><div>${inner}</div></div>`);
    const anim=ST.sec===s.id&&ST.anim?' anim-'+ST.anim:'';
    return `<section class="page ${ST.sec===s.id?'on':''}${anim}" id="p-${s.id}" role="tabpanel">${h}</section>`}).join('');
  ST.anim=null;
  const i=SECTIONS.findIndex(s=>s.id===ST.sec);
  const pv=$('#prev'),nx=$('#next');
  pv.disabled=i===0;nx.disabled=i===SECTIONS.length-1;
  pv.textContent=i>0?'‹ '+SECTIONS[i-1].t:'';nx.textContent=i<SECTIONS.length-1?SECTIONS[i+1].t+' ›':'';
  const fn=NUM(SECTIONS[i].id);$('#fsLab').textContent=`${fn?fn+'. ':''}${SECTIONS[i].t}  (${i+1}/${SECTIONS.length})`;
  $('#fsPrev').disabled=i===0;$('#fsNext').disabled=i===SECTIONS.length-1;
}
/* ---------- mode presentasi (layar penuh) ---------- */
function startPresent(){
  ST.sec='cover';document.body.classList.add('present');render();window.scrollTo({top:0});
  const el=document.documentElement;
  if(el.requestFullscreen&&!document.fullscreenElement) el.requestFullscreen().catch(()=>{});
}
function stopPresent(){document.body.classList.remove('present');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});render()}
function setSec(id){
  const from=SECTIONS.findIndex(s=>s.id===ST.sec),to=SECTIONS.findIndex(s=>s.id===id);
  if(to===from)return;
  ST.anim=to>from?'next':'prev';
  ST.sec=id;render();window.scrollTo({top:0})}
function setPer(k){ST.per=k;ST.slide=0;$('#per').value=k;render()}

let LAST,PERIODS=[];
function setTheme(t){document.documentElement.dataset.theme=t;
  document.querySelectorAll('[data-theme-set]').forEach(b=>{const on=b.dataset.themeSet===t;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}
function init(){
  setTheme(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.querySelectorAll('[data-theme-set]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeSet));
  $('#present').onclick=startPresent;$('#fsExit').onclick=stopPresent;
  $('#fsPrev').onclick=()=>$('#prev').click();$('#fsNext').onclick=()=>$('#next').click();
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('present')){document.body.classList.remove('present');render()}});
  setupPeriods(true);
  $('#per').addEventListener('change',e=>setPer(e.target.value));
  $('#prev').onclick=()=>{const i=SECTIONS.findIndex(s=>s.id===ST.sec);if(i>0)setSec(SECTIONS[i-1].id)};
  $('#next').onclick=()=>{const i=SECTIONS.findIndex(s=>s.id===ST.sec);if(i<SECTIONS.length-1)setSec(SECTIONS[i+1].id)};
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-sec],[data-k],[data-kab],[data-bud],[data-sl],[data-mv],[data-scope],[data-fy],.ind-n');if(!t)return;
    if(t.disabled)return;
    if(t.dataset.sec)setSec(t.dataset.sec);
    else if(t.dataset.k)setPer(t.dataset.k);
    else if(t.dataset.fy){shiftFY(+t.dataset.fy)}
    else if(t.dataset.scope){ST.scope=t.dataset.scope;render()}
    else if(t.dataset.kab){ST.kab=t.dataset.kab;render()}
    else if(t.dataset.bud){ST.bud=t.dataset.bud;render()}
    else if(t.dataset.sl)goSlide(+t.dataset.sl);
    else if(t.dataset.mv)goSlide(ST.slide+ +t.dataset.mv);
    else if(t.classList.contains('ind-n'))t.classList.toggle('open');
  });
  document.addEventListener('keydown',e=>{
    if(e.target.matches('select,input,textarea'))return;
    if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.k){setPer(e.target.dataset.k);return}
    if(e.key==='Escape'&&document.body.classList.contains('present')){stopPresent();return}
    const fwd=['ArrowRight','PageDown'],back=['ArrowLeft','PageUp'];
    if(!fwd.includes(e.key)&&!back.includes(e.key))return;
    e.preventDefault();
    const d=fwd.includes(e.key)?1:-1;
    if(ST.sec==='highlight'&&(KONTEN.highlight[ST.per]||[]).length){const n=KONTEN.highlight[ST.per].length;const ni=ST.slide+d;if(ni>=0&&ni<n){goSlide(ni);return}}
    const i=SECTIONS.findIndex(s=>s.id===ST.sec)+d;if(i>=0&&i<SECTIONS.length)setSec(SECTIONS[i].id);
  });
  // swipe for carousel
  let sx=null;
  document.addEventListener('touchstart',e=>{if(e.target.closest('#car'))sx=e.touches[0].clientX},{passive:true});
  document.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40)goSlide(ST.slide+(dx<0?1:-1))});
  let lastSm=SM();window.addEventListener('resize',()=>{if(SM()!==lastSm){lastSm=SM();render()}});
  render();
  startSync();
}
init();

