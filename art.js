// art.js ── 仮の立ち絵（SVGで描く）。本番の画像ができたら characters.js の img に差し替える
// 表情：normal（ふつう）/ smile（笑顔）/ shy（照れ）/ trouble（困り顔）
// セリフで表情を変えるとき：L('town','k','航','…',{f:'smile'}) のように f を付ける（話している人の表情が変わる）
// 立ち絵の枠は 170×300。顔の中心はおよそ (85,84)
const ART_FACES=['normal','smile','shy','trouble'];
const INK='#3b2b2b',SKIN='#f7dfc9',SKIN2='#e9c3a6';
// キャラごとの見た目（色は characters.js の hair / coat を使う）
const LOOK={
 wataru:{hair:'soft',eyes:'gentle',outfit:'cardigan',shirt:'#f4f1ea'},
 ao:    {hair:'bob',eyes:'bright',outfit:'coat',shirt:'#f3e2c4',acc:'clip'},
 yama1: {hair:'pony',eyes:'calm',outfit:'fleece',shirt:'#e8efe6'},
 yama2: {hair:'crop',eyes:'firm',outfit:'vest',shirt:'#b5533c',acc:'stubble',broad:1},
 machi1:{hair:'bun',eyes:'bright',outfit:'apron',shirt:'#f6efe2',acc:'bandana'},
 machi2:{hair:'neat',eyes:'calm',outfit:'turtle',shirt:'#3c4250',acc:'glasses'}};

function artSVG(id,face){const c=CHARS[id],L=LOOK[id];if(!c||!L)return '';face=ART_FACES.includes(face)?face:'normal';
 const H=c.hair,C=c.coat,dk=shade(H,-.25);
 return `<svg viewBox="0 0 170 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
 <g stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
 <g transform="translate(85 132) scale(1.14) translate(-85 -128)">${hairBack(L.hair,H,dk)}</g>
 ${body(L,C)}
 ${L.hair=='pony'?`<path d="M114 118q14 18 10 44q-4 26 0 50q-14 -6 -18 -30q-4 -26 0 -50z" fill="${H}"/><path d="M110 120q6 2 8 8" fill="none"/>`:''}
 <path d="M76 120h18v22q-9 6 -18 0z" fill="${SKIN2}"/>
 <g transform="translate(85 132) scale(1.14) translate(-85 -128)">
 <ellipse cx="51" cy="88" rx="6" ry="9" fill="${SKIN}"/><ellipse cx="119" cy="88" rx="6" ry="9" fill="${SKIN}"/>
 <path d="M52 78q0-42 33-42t33 42q0 26-12 38q-10 10-21 10t-21-10q-12-12-12-38z" fill="${SKIN}"/>
 ${L.acc=='stubble'?'<g stroke="none" fill="#7a5a48" opacity=".45"><circle cx="72" cy="114" r="1"/><circle cx="78" cy="118" r="1"/><circle cx="85" cy="119" r="1"/><circle cx="92" cy="118" r="1"/><circle cx="98" cy="114" r="1"/><circle cx="75" cy="110" r="1"/><circle cx="95" cy="110" r="1"/></g>':''}
 ${faceParts(L.eyes,face,0)}
 ${hairFront(L.hair,H,dk)}
 ${faceParts(L.eyes,face,1)}
 ${acc(L.acc,C)}
 </g></g></svg>`}

// ---- 髪（後ろ）----
function hairBack(t,H,dk){
 if(t=='bob')return `<path d="M44 84q-6-56 41-58t41 58q2 26-6 46q-14 4-20-2l2-30h-34l2 30q-6 6-20 2q-8-20-6-46z" fill="${H}"/>`;
 if(t=='pony')return `<path d="M48 86q-4-54 37-56t37 56q-6-10-10-14h-54q-4 4-10 14z" fill="${H}"/>`;
 if(t=='bun')return `<circle cx="85" cy="33" r="15" fill="${H}"/><path d="M48 86q-4-54 37-56t37 56q-6-12-12-16h-50q-6 4-12 16z" fill="${H}"/>`;
 if(t=='crop')return `<path d="M50 80q-2-46 35-48t35 48q-4-8-8-10h-54q-4 2-8 10z" fill="${H}"/>`;
 return `<path d="M47 90q-6-58 38-60t38 60q-2 10-6 16l-4-24h-56l-4 24q-4-6-6-16z" fill="${H}"/>`}
// ---- 髪（前）----
function hairFront(t,H,dk){
 if(t=='soft')return `<path d="M50 74q2-38 36-40q34 2 34 38q-8-14-16-18q-4 12-16 16q2-8-2-14q-10 14-28 16q4-6 4-12q-8 6-12 14z" fill="${H}"/>`;
 if(t=='bob')return `<path d="M49 78q0-42 36-44q36 2 36 44q-8-6-12-18q-6 10-20 12q4-6 2-12q-12 12-30 12q-6 2-12 6z" fill="${H}"/>`;
 if(t=='pony')return `<path d="M51 80q0-44 34-46q34 2 34 46q-6-14-14-20q-8 10-26 12q8-6 8-14q-14 14-30 16q-4 2-6 6z" fill="${H}"/>`;
 if(t=='crop')return `<path d="M51 70q4-36 34-38q30 2 34 38q-8-10-16-12l-4 6-6-8-6 8-6-8-6 8-6-8-4 6q-8 2-14 8z" fill="${H}"/>`;
 if(t=='bun')return `<path d="M50 78q2-42 35-44q33 2 35 44q-10-10-14-20q-8 8-22 10q6-4 6-10q-12 10-28 12q-6 2-12 8z" fill="${H}"/>`;
 if(t=='neat')return `<path d="M50 80q0-46 36-48q34 2 34 42q-6-8-12-12q-10 6-24 6q6-4 8-10q-16 10-28 26q-2-8-4-12q-6 2-10 8z" fill="${H}"/>`;
 return ''}
// ---- 目・眉・口（表情）----
function faceParts(e,f,part){
 const ry={gentle:7,bright:8,calm:5.6,firm:6.2}[e]||7,y=91,xs=[70,100];
 let brow,eyes,mouth,extra='';
 const bt={gentle:2,bright:-1,calm:0,firm:-3}[e]||0;   // 眉の傾き（＋で下がり眉）
 brow=f=='trouble'?xs.map((x,i)=>{const s=i?-1:1;return `<path d="M${x-9*s} ${y-12}q${8*s} -6 ${16*s} -2" fill="none" stroke-width="2.5" transform="rotate(${-14*s} ${x} ${y-14})"/>`}).join('')
  :xs.map((x,i)=>{const s=i?-1:1;return `<path d="M${x-8*s} ${y-14+bt}q${8*s} -5 ${16*s} ${-bt}" fill="none" stroke-width="2.5"/>`}).join('');
 if(f=='smile')eyes=xs.map(x=>`<path d="M${x-7} ${y+1}q7 -9 14 0" fill="none" stroke-width="3"/>`).join('');
 else{const dx=f=='shy'?-3:0,r=f=='shy'?ry*.8:ry;
  eyes=xs.map(x=>`<ellipse cx="${x+dx}" cy="${y}" rx="${r*.72}" ry="${r}" fill="#2b2233" stroke="none"/><ellipse cx="${x+dx}" cy="${y+r*.35}" rx="${r*.5}" ry="${r*.4}" fill="#5a4a6a" stroke="none"/><circle cx="${x+dx+r*.28}" cy="${y-r*.38}" r="${r*.28}" fill="#fff" stroke="none"/>`).join('')
   +xs.map((x,i)=>{const s=i?-1:1,t=e=='gentle'?2.5:e=='calm'?-0.5:0;return `<path d="M${x-8*s} ${y-r+1}q${8*s} -4 ${16*s} ${t}" fill="none" stroke-width="3"/>`}).join('')}
 if(f=='smile')mouth=`<path d="M76 106q9 10 18 0q-9 4-18 0z" fill="#c9586a"/>`;
 else if(f=='shy')mouth=`<path d="M80 108q2.5 -2 5 0t5 0" fill="none" stroke-width="2"/>`;
 else if(f=='trouble')mouth=`<path d="M79 110q6 -5 12 0" fill="none" stroke-width="2"/>`;
 else mouth=e=='firm'?`<path d="M79 107h12" fill="none" stroke-width="2"/>`:`<path d="M79 106q6 4 12 0" fill="none" stroke-width="2"/>`;
 if(f=='shy'||f=='smile')extra+=`<g stroke="none" fill="#f08a9a" opacity="${f=='shy'?.75:.4}"><ellipse cx="63" cy="100" rx="7" ry="4"/><ellipse cx="107" cy="100" rx="7" ry="4"/></g>`;
 if(f=='shy')extra+=`<path d="M60 99l3 -3M65 99l3 -3M102 99l3 -3M107 99l3 -3" stroke="#d9667a" stroke-width="1.4"/>`;
 if(f=='trouble')extra+=`<path d="M122 66q5 8 0 12q-5 -4 0 -12z" fill="#bfe6f5" stroke="#6aa9c4" stroke-width="1.5"/>`;
 if(part)return brow;
 return eyes+`<path d="M85 94l-2 6h4" fill="none" stroke-width="1.6" opacity=".6"/>`+mouth+extra}
// ---- 服 ----
function body(L,C){const w=L.broad?6:0,sh=shade(C,-.2),S=L.shirt;
 const torso=`M${22-w} 300q0-108 ${36+w} -148h54q${36+w} 40 ${36+w} 148z`;
 if(L.outfit=='cardigan')return `<path d="${torso}" fill="${C}"/><path d="M68 150l17 40l17 -40z" fill="${S}"/><path d="M70 150l15 22l15 -22" fill="none"/><path d="M85 190v110" fill="none"/><g fill="#e8e0cc" stroke="none"><circle cx="90" cy="215" r="2.5"/><circle cx="90" cy="245" r="2.5"/><circle cx="90" cy="275" r="2.5"/></g>`;
 if(L.outfit=='coat')return `<path d="${torso}" fill="${C}"/><path d="M60 150l25 70l25 -70z" fill="${shade(C,.15)}"/><path d="M60 140q25 22 50 0q8 10 2 22q-27 16 -54 0q-6 -12 2 -22z" fill="${S}"/><path d="M68 156l-6 40h14l2 -34z" fill="${S}"/><path d="M70 150h30M66 156h38" stroke="#c0605a" stroke-width="2"/>`;
 if(L.outfit=='fleece')return `<path d="${torso}" fill="${C}"/><path d="M64 140q21 12 42 0l4 22q-25 12 -50 0z" fill="${sh}"/><path d="M85 160v140" stroke="#d8d8d0" stroke-width="2.5"/><path d="M46 200q8 30 4 100M124 200q-8 30 -4 100" fill="none" opacity=".5"/>`;
 if(L.outfit=='vest')return `<path d="${torso}" fill="${S}"/><g stroke="#7a2e22" stroke-width="2" opacity=".55" fill="none"><path d="M36 210h98M30 250h110M26 290h118M66 160v140M104 160v140"/></g><path d="M${22-w} 300q0-108 ${36+w} -148h8l10 148zM${148+w} 300q0-108 ${-36-w} -148h-8l-10 148z" fill="${C}"/><rect x="34" y="232" width="22" height="18" rx="3" fill="${sh}"/><rect x="114" y="232" width="22" height="18" rx="3" fill="${sh}"/><path d="M70 150l15 18l15 -18" fill="none"/>`;
 if(L.outfit=='apron')return `<path d="${torso}" fill="${C}"/><path d="M70 150l15 16l15 -16z" fill="${S}"/><path d="M58 176h54l8 124h-70z" fill="#f3ead8"/><path d="M58 176l-6 -26M112 176l6 -26" stroke-width="6" stroke="#f3ead8"/><path d="M58 176l-6 -26M112 176l6 -26" fill="none"/><rect x="72" y="214" width="26" height="20" rx="3" fill="#ebdfc8"/>`;
 if(L.outfit=='turtle')return `<path d="${torso}" fill="${C}"/><path d="M58 150l27 150l27 -150z" fill="${S}"/><path d="M70 132q15 8 30 0v20q-15 8 -30 0z" fill="${S}"/><path d="M58 150l20 40M112 150l-20 40" fill="none"/>`;
 return `<path d="${torso}" fill="${C}"/>`}
// ---- 小物 ----
function acc(a,C){
 if(a=='clip')return `<rect x="96" y="50" width="16" height="5" rx="2" fill="#f2c94c" transform="rotate(-20 104 52)"/>`;
 if(a=='bandana')return `<path d="M50 62q35 -26 70 0q-35 -10 -70 0z" fill="#d9534f"/><path d="M118 60l10 6l-6 6z" fill="#d9534f"/>`;
 if(a=='glasses')return `<g fill="#ffffff22" stroke="#2f3440" stroke-width="2"><rect x="58" y="81" width="24" height="18" rx="7"/><rect x="88" y="81" width="24" height="18" rx="7"/><path d="M82 88h6M58 86l-6 -2M112 86l6 -2" fill="none"/></g>`;
 return ''}
function shade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));
 return '#'+[n>>16,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('')}
