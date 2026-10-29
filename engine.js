// engine.js ── 進行・分岐・好感度・エンド判定。ふだんは触らなくてOK
// シナリオは scenario/*.js、キャラ設定は characters.js、見た目は style.css
const $=s=>document.querySelector(s);
const S={},MAPS={},MEMO=[];                           // S:シーン集 / MAPS:地図ミニゲーム / MEMO:共通の防災メモ
const st={name:'',who:null,aff:{},log:[],flags:{}};   // aff:キャラ別の好感度 / log:増減の記録 / flags:フラグ
const L=(bg,c,sp,t,x)=>Object.assign({bg,c,sp,t},x); // セリフ1行
const BY={};Object.entries(CHARS).forEach(([id,c])=>{c.id=id;BY[c.sym]=c});
let steps=[],i=0,sel=new Set(),curMap=null;
const T=s=>s.replace(/\{n\}/g,st.name);
const hide=()=>['#ti','#map','#en','#loc','#lr'].forEach(s=>{const e=$(s);if(e)e.hidden=true});
const ICON={sign:p=>`<g class="sp" data-id="${p.id}"><rect x="${p.x-22}" y="${p.y-22}" width="44" height="44" rx="8" fill="#1c9a69" stroke="#fff" stroke-width="2"/><path d="M${p.x-11} ${p.y+6}l11-17 11 17z" fill="#fff"/><path d="M${p.x-15} ${p.y+14}q4-4 7.5 0t7.5 0 7.5 0 7.5 0" stroke="#fff" stroke-width="2.5" fill="none"/></g>`};

function hearts(){const c=CHARS[st.who];if(!c){$('#hr').textContent='';return}
 const m=c.max||8,n=Math.max(0,Math.min(st.aff[st.who]||0,m));$('#hr').textContent=c.name+'　'+'♥'.repeat(n)+'♡'.repeat(m-n)}
function add(d,w,who=st.who){st.aff[who]=(st.aff[who]||0)+d;st.log.push([who,d,T(w||'')]);hearts()}
const hh=(h,w)=>typeof h=='number'?add(h,w):Object.entries(h).forEach(([k,v])=>add(v,w,k));

const nameColor=sp=>{if(sp=='{n}')return '#c04a62';const c=Object.values(CHARS).find(c=>c.name==sp);return c?c.color:'#fff3'};
const pickList=r=>Object.entries(CHARS).filter(([id,c])=>!r||r===1||c.region===r).map(([id,c])=>[c.full+(c.blurb?'　'+c.blurb:'')+(c.ready?'':'（準備中）'),c.ready?()=>startRoute(id):null]);
function startRoute(id){st.who=id;hearts();play(S[CHARS[id].start])}
// 立ち絵：characters.js の img が文字列なら全表情共通、{normal:'…',smile:'…'} なら表情ごと。img がなければ art.js の仮の絵
const pic=(c,f)=>!c.img?null:typeof c.img=='string'?c.img:(c.img[f]||c.img.normal||null);
function play(a){steps=a;i=0;draw()}
function go(t){const r=typeof t=='function'?t(st):t;if(typeof r=='string')play(S[r]);else if(Array.isArray(r))play(r)}

function draw(){const s=steps[i];if(s.h)hh(s.h,s.why);if(s.set)Object.assign(st.flags,s.set);
 $('#bg').className=s.bg;$('#sp').className=s.c.length>1?'two':'';
 $('#sp').innerHTML=[...s.c].map(k=>{const c=BY[k];if(!c)return '';const on=c.name==s.sp||(s.sp=='？？'&&s.c.length==1),f=on&&s.f||'normal',im=pic(c,f);
  return `<div class="c ${on||s.sp=='？？'?'on':''} ${im?'img':''} ${!im&&typeof artSVG=='function'?'art':''}" style="--hair:${c.hair};--coat:${c.coat};${im?`background-image:url(${im})`:''}">${!im&&typeof artSVG=='function'?artSVG(c.id,f):''}</div>`}).join('');
 const n=$('#nm');n.textContent=T(s.sp);n.hidden=!s.sp;n.style.background=nameColor(s.sp);
 $('#tx').textContent=T(s.t);$('#box').hidden=false;
 const list=s.pick?pickList(s.pick):s.ch,ch=$('#ch');ch.innerHTML='';$('#nx').hidden=!!list;
 if(list)list.forEach(([l,t,h,o])=>{if(o&&o.if&&!o.if(st))return;
  const b=document.createElement('button');b.textContent=T(l);if(t===null)b.className='off';
  b.onclick=e=>{e.stopPropagation();if(t===null)return toast('このルートは準備中です');
   if(h)hh(h,l);if(o&&o.set)Object.assign(st.flags,o.set);ch.innerHTML='';go(t)};ch.appendChild(b)})}
function adv(){const s=steps[i];if(!s||s.ch||s.pick||!$('#ti').hidden||!$('#map').hidden||!$('#en').hidden)return;
 if(s.map)return openMap(s.map);if(s.end)return ending(s.end);if(s.then)return go(s.then);if(++i<steps.length)draw()}
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;$('#app').appendChild(d);setTimeout(()=>d.remove(),1800)}
$('#box').onclick=adv;
document.onkeydown=e=>{if((e.key=='Enter'||e.key==' ')&&document.activeElement.tagName=='BODY'){e.preventDefault();adv()}};

// エンド判定：そのルートのキャラの好感度で H / N / B に振り分け（しきい値は characters.js の th）
function judge(){const c=CHARS[st.who],n=st.aff[st.who]||0,[h,m]=c.th||[6,3];play(S[c.end+(n>=h?'H':n>=m?'N':'B')])}

// 地図ミニゲーム（データは MAPS.○○ に書く）
function openMap(id){const m=curMap=MAPS[id];hide();$('#box').hidden=true;$('#sp').innerHTML='';sel=new Set();
 $('#mt').textContent=m.title;$('#mp').textContent=T(m.intro);$('#hn').textContent=m.hint(st);
 $('#sv').innerHTML=m.bg+m.spots.map(p=>p.icon?ICON[p.icon](p):`<g class="sp" data-id="${p.id}"><circle cx="${p.x}" cy="${p.y}" r="${p.r||21}"/><text x="${p.x}" y="${p.y+(p.fs||18)/3}" text-anchor="middle" font-size="${p.fs||18}">${p.g}</text><text x="${p.x}" y="${p.y+(p.r||21)+17}" text-anchor="middle" font-size="12">${p.n}</text></g>`).join('');
 updMap();$('#map').hidden=false}
function updMap(){const n=curMap.need||3;document.querySelectorAll('#sv .sp').forEach(g=>g.classList.toggle('s',sel.has(g.dataset.id)));
 const b=$('#vg');b.disabled=sel.size!=n;b.textContent=sel.size==n?(curMap.go||`この${n}か所へ行く`):(curMap.ask||`あと${n-sel.size}か所えらぼう`)}
$('#sv').onclick=e=>{const g=e.target.closest('.sp');if(!g)return;const d=g.dataset.id;const k=curMap.need||3;if(sel.has(d))sel.delete(d);else{if(k==1)sel.clear();if(sel.size<k)sel.add(d)}updMap()};
$('#vg').onclick=()=>{hide();play(curMap.done(sel,st))};

function ending(t){const c=CHARS[st.who],n=st.aff[st.who]||0;$('#box').hidden=true;$('#sp').innerHTML='';$('#bg').className='dusk';
 const lg=st.log.filter(l=>l[0]==st.who).map(l=>(l[1]>0?'＋':'')+l[1]+'　'+l[2]).join('<br>')||'変化なし';
 const M=[...MEMO,...(c.memo||[])].map(m=>{const ok=!m.k||st.flags[m.k];return `<div class="card ${ok?'':'no'}"><h3>${m.t}${ok?'':'（未発見）'}</h3>${m.b}</div>`}).join('');
 $('#en').innerHTML=`<h2 style="margin:0 0 4px">${t}</h2><p style="margin:0 0 8px">好感度（${c.name}）　<b style="color:var(--pink)">${n}</b></p><h3 style="margin:16px 0 0">好感度の記録</h3><div class="card">${lg}</div><h3 style="margin:16px 0 0">この街で身につけた防災メモ</h3>${M}<button class="btn" style="width:100%" onclick="$('#rs').click()">タイトルへ</button>`;
 $('#en').hidden=false;$('#en').scrollTop=0}

function begin(n){st.name=(n||'ハル').replace(/[<>&"']/g,'');st.who=null;st.aff={};st.log=[];st.flags={};hide();$('#hud').hidden=false;hearts()}
$('#go').onclick=()=>{begin($('#in').value.trim());play(S.intro)};
$('#rs').onclick=()=>{$('#hud').hidden=true;$('#box').hidden=true;$('#ch').innerHTML='';$('#sp').innerHTML='';hide();$('#ti').hidden=false};
// 開発用ジャンプ：…/index.html#ao のように「#キャラID」を付けて開くと、そのルートの最初から始まる（ローカルでは #ao/ao_d のようにシーンIDも指定できる）
function start(){const v=$('#ver');if(v&&typeof VERSION!='undefined')v.textContent='v'+VERSION.no+'　'+VERSION.name+'（'+VERSION.date+'）';
 const[w,sc]=location.hash.slice(1).split('/');if(CHARS[w]){begin('ハル');st.who=w;hearts();play(S[sc]||S[CHARS[w].start])}}
