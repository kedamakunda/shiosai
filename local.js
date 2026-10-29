// local.js ── 「自分の街で遊ぶ」モード
//   ① 住所か現在地から、その場所のハザード情報・標高・避難場所を読み取る
//   ② 読み取った結果で、物語の地域（sea / mountain / town）を決める
//   ③ エンディングのあとに「あなたの家のまわり」を実際の地図で歩くミニゲームを出す
// データはすべて国土地理院（地理院タイル／ハザードマップポータルサイトのオープンデータ）から、ブラウザで直接読む。
// 住所や位置は保存しない（ページを閉じると消える）。住所で調べるときだけ、国土地理院の住所検索に送られる。
// ※ file:// で開くとデータを読めないことがある。GitHub Pages など https で開いて試す。
let LOC=null;
const GSI={
 pale:'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
 dem:'https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png',
 hz:'https://disaportaldata.gsi.go.jp/raster/{l}/{z}/{x}/{y}.png',
 skhb:'https://cyberjapandata.gsi.go.jp/xyz/skhb0{k}/{z}/{x}/{y}.geojson',
 search:'https://msearch.gsi.go.jp/address-search/AddressSearch?q=',
 rev:'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress'};
const LZ=16,VW=360,VH=400,HX=180,HY=200,NEAR=120;   // 地図はズーム16、家は画面の中央。NEAR=「家のまわり」とみなす距離（px、約200m）
// 浸水の深さ：凡例の色 → 文字（浅い順）
const DEPTH=[['f7f5a9','0.5m未満'],['ffd8c0','0.5〜3m'],['ffb7b7','3〜5m'],['ff9191','5〜10m'],['f285c9','10〜20m'],['dc7adc','20m以上']];
const TDEPTH=[['ffffb3','0.3m未満'],['f7f5a9','0.3〜0.5m'],['f8e1a6','0.5〜1m'],['ffd8c0','1〜3m'],['ffb7b7','3〜5m'],['ff9191','5〜10m'],['f285c9','10〜20m'],['dc7adc','20m以上']];
const DOSHA=[['e6c832','警戒区域'],['fae600','警戒区域'],['ffeb00','警戒区域'],['a50021','特別警戒区域'],['fa2800','特別警戒区域'],['c80000','特別警戒区域']];
const LAYERS={
 flood:{l:'01_flood_l2_shinsuishin_data',name:'川があふれたとき（想定最大規模）',leg:DEPTH,kind:'water'},
 tide:{l:'03_hightide_l2_shinsuishin_data',name:'高潮',leg:DEPTH,kind:'water'},
 tsunami:{l:'04_tsunami_newlegend_data',name:'津波',leg:TDEPTH,kind:'water'},
 dosha1:{l:'05_dosekiryukeikaikuiki',name:'土石流',leg:DOSHA,kind:'dosha'},
 dosha2:{l:'05_kyukeishakeikaikuiki',name:'がけ崩れ',leg:DOSHA,kind:'dosha'},
 dosha3:{l:'05_jisuberikeikaikuiki',name:'地すべり',leg:DOSHA,kind:'dosha'}};
const EVTYPE={1:'洪水',2:'土砂災害',3:'高潮',4:'地震',5:'津波',6:'大きな火事',7:'内水氾濫',8:'火山'};
const REGION_NAME={sea:'海の近く',mountain:'山の近く',town:'住宅が密集する街'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---- 座標の変換（緯度経度 ⇔ ズーム16の画素）----
const proj=(lat,lon,z=LZ)=>{const n=256*2**z,r=lat*Math.PI/180;return [(lon+180)/360*n,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n]};
const toView=(lat,lon)=>{const [x,y]=proj(lat,lon);return [x-LOC.ox,y-LOC.oy]};
const mpp=()=>156543.03*Math.cos(LOC.lat*Math.PI/180)/2**LZ;          // 1画素あたりのメートル
const dist=(x,y)=>Math.round(Math.hypot(x-HX,y-HY)*mpp()/10)*10;
function tiles(z){const s=2**(LZ-z),a=[],T=256*s;
 for(let x=Math.floor(LOC.ox/T);x<=Math.floor((LOC.ox+VW-1)/T);x++)for(let y=Math.floor(LOC.oy/T);y<=Math.floor((LOC.oy+VH-1)/T);y++)a.push({x,y,dx:x*T-LOC.ox,dy:y*T-LOC.oy,sz:T});return a}
const fill=(u,o)=>u.replace(/\{(\w)\}/g,(m,k)=>o[k]);

// 地図の範囲ぶんのタイルを1枚の画像に貼り合わせて、画素を読めるようにする（データがなければ null）
async function readLayer(url,z=LZ){const c=document.createElement('canvas');c.width=VW;c.height=VH;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;let any=false;
 await Promise.all(tiles(z).map(async t=>{try{const r=await fetch(fill(url,{z,x:t.x,y:t.y}));if(!r.ok)return;const b=await createImageBitmap(await r.blob());g.drawImage(b,t.dx,t.dy,t.sz,t.sz);any=true}catch(e){}}));
 return any?g.getImageData(0,0,VW,VH):null}
const pix=(d,x,y)=>{if(!d)return null;x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=VW||y>=VH)return null;const i=(y*VW+x)*4;return d.data[i+3]<128?null:[d.data[i],d.data[i+1],d.data[i+2]]};
function classify(rgb,leg){if(!rgb)return -1;let b=-1,bd=1e9;leg.forEach(([h],i)=>{const d=[0,2,4].reduce((s,k,j)=>s+Math.abs(parseInt(h.substr(k,2),16)-rgb[j]),0);if(d<bd){bd=d;b=i}});return bd<60?b:-1}
function demAt(d,x,y){const p=pix(d,x,y);if(!p)return null;const v=p[0]*65536+p[1]*256+p[2];return v==8388608?null:(v<8388608?v:v-16777216)*0.01}

// ---- 場所を読み取る ----
async function analyze(lat,lon,label){
 const [hx,hy]=proj(lat,lon);LOC={lat,lon,ox:Math.round(hx-HX),oy:Math.round(hy-HY),hz:{},spots:[]};
 const [town,evac,dem,...hz]=await Promise.all([
  fetch(`${GSI.rev}?lat=${lat}&lon=${lon}`).then(r=>r.json()).then(j=>j.results&&j.results.lv01Nm).catch(()=>null),
  readEvac(),readLayer(GSI.dem,14),...Object.values(LAYERS).map(L=>readLayer(fill(GSI.hz,{l:L.l,z:'{z}',x:'{x}',y:'{y}'})))]);
 LOC.town=(town&&town!='－'?town:'')||label||'このあたり';
 // ハザード：家の場所／家のまわり（約200m）／地図の範囲 にあるかどうか
 Object.keys(LAYERS).forEach((k,i)=>{const L=LAYERS[k],d=hz[i],h={home:classify(pix(d,HX,HY),L.leg),near:false,any:false,max:-1,best:null};
  if(d)for(let y=0;y<VH;y+=3)for(let x=0;x<VW;x+=3){const c=classify(pix(d,x,y),L.leg);if(c<0)continue;h.any=true;const r=Math.hypot(x-HX,y-HY);if(r<NEAR)h.near=true;
   if(x>24&&x<VW-24&&y>24&&y<VH-36&&r>40){const sc=c*1000-r;if(!h.best||sc>h.bestSc){h.best=[x,y,c];h.bestSc=sc}}}
  LOC.hz[k]=h});
 // 標高：家の高さと、まわりで一番高い所・低い所
 LOC.elev=demAt(dem,HX,HY);let hi=null,lo=null;
 if(dem)for(let y=30;y<VH-40;y+=10)for(let x=30;x<VW-30;x+=10){if(Math.hypot(x-HX,y-HY)<50)continue;const e=demAt(dem,x,y);if(e==null)continue;if(!hi||e>hi[2])hi=[x,y,e];if(!lo||e<lo[2])lo=[x,y,e]}
 // 地図ミニゲームの候補地
 const sp=LOC.spots;
 // 地図の中の避難場所を近い順に3つまで。2つに満たなければ、地図の外のいちばん近いものを、その方向の地図の端に置く
 const inE=evac.filter(e=>e.inside).slice(0,3),outE=evac.filter(e=>!e.inside).slice(0,Math.max(0,2-inE.length));
 outE.forEach(e=>{const a=Math.atan2(e.y-HY,e.x-HX),k=Math.min((HX-30)/Math.abs(Math.cos(a)||1e-9),(HY-46)/Math.abs(Math.sin(a)||1e-9));e.x=HX+Math.cos(a)*k;e.y=HY+Math.sin(a)*k;e.edge=1});
 [...inE,...outE].forEach((e,i)=>sp.push({id:'ev'+i,kind:'evac',x:e.x,y:e.y,g:'避',n:short(e.name),full:e.name,types:e.types,dist:e.d,edge:e.edge}));
 if(hi&&LOC.elev!=null&&hi[2]-LOC.elev>=2)sp.push({id:'hi',kind:'high',x:hi[0],y:hi[1],g:'高',n:'小高い所',e:hi[2]});
 if(lo&&LOC.elev!=null&&LOC.elev-lo[2]>=1)sp.push({id:'lo',kind:'low',x:lo[0],y:lo[1],g:'低',n:'低い所',e:lo[2]});
 const w=['tsunami','tide','flood'].find(k=>LOC.hz[k].best);
 if(w){const b=LOC.hz[w].best;sp.push({id:'wa',kind:'water',layer:w,x:b[0],y:b[1],g:'水',n:w=='flood'?'川に近い所':'海に近い所',c:b[2]})}
 const ds=['dosha1','dosha2','dosha3'].filter(k=>LOC.hz[k].best).sort((a,b)=>Math.hypot(LOC.hz[a].best[0]-HX,LOC.hz[a].best[1]-HY)-Math.hypot(LOC.hz[b].best[0]-HX,LOC.hz[b].best[1]-HY))[0];
 if(ds){const b=LOC.hz[ds].best;sp.push({id:'ds',kind:'dosha',layer:ds,x:b[0],y:b[1],g:'坂',n:'山すその道',c:b[2]})}
sp.forEach(p=>{if(p.dist==null)p.dist=dist(p.x,p.y);if(dem&&p.e==null)p.e=demAt(dem,p.x,p.y)});
 spread(sp);
 decide();return LOC}

// 指定緊急避難場所（洪水・土砂・高潮・地震・津波・火事）を地図の範囲から近い順に
async function readEvac(){const z=10,seen={},out=[];if(!LOC)return out;
 const ts=tiles(z);await Promise.all([1,2,3,4,5,6].flatMap(k=>ts.map(async t=>{try{const r=await fetch(fill(GSI.skhb,{k,z,x:t.x,y:t.y}));if(!r.ok)return;const j=await r.json();
  (j.features||[]).forEach(f=>{const[lon,lat]=f.geometry.coordinates,p=f.properties||{},key=p.name+lat.toFixed(5);if(seen[key])return;
   const [x,y]=toView(lat,lon),d=Math.hypot(x-HX,y-HY)*mpp();if(d>2000)return;seen[key]=1;
   out.push({name:p.name||'避難場所',x,y,d:Math.round(d/10)*10,inside:x>=28&&x<=VW-28&&y>=28&&y<=VH-44,types:Object.keys(EVTYPE).filter(n=>p['disaster'+n]==1).map(n=>EVTYPE[n])})})}catch(e){}})));
 return out.sort((a,b)=>Math.hypot(a.x-HX,a.y-HY)-Math.hypot(b.x-HX,b.y-HY))}
const short=n=>{n=String(n).replace(/^.{1,6}?[都道府県市区町村]立/,'').replace(/（.*?）|\(.*?\)/g,'');return n.length>8?n.slice(0,7)+'…':n};
// 候補地が重ならないように少しずらす
function spread(A){for(let k=0;k<20;k++)A.forEach((a,i)=>A.forEach((b,j)=>{if(i>=j)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d<54){const m=(54-d)/2;a.x-=dx/d*m;a.y-=dy/d*m;b.x+=dx/d*m;b.y+=dy/d*m}}));
 A.forEach(p=>{p.x=Math.max(26,Math.min(VW-26,p.x));p.y=Math.max(26,Math.min(VH-48,p.y));if(Math.hypot(p.x-HX,p.y-HY)<60){const a=Math.atan2(p.y-HY,p.x-HX)||1;p.x=HX+Math.cos(a)*60;p.y=HY+Math.sin(a)*60}p.x=Math.max(40,Math.min(VW-40,p.x))})}

// 地域の振り分け（ゲーム中は防災の説明をしないので、理由はやわらかい言い方にとどめる）
function decide(){const h=LOC.hz,e=LOC.elev;
 if(h.tsunami.near||h.tide.near){LOC.region='sea';LOC.why='海に近い、平らな土地の街。'}
 else if(h.dosha1.near||h.dosha2.near||h.dosha3.near){LOC.region='mountain';LOC.why='山すそに近い街。家のまわりに、坂や斜面があります。'}
 else if(h.flood.near&&e!=null&&e<10){LOC.region='sea';LOC.why='川や海に近い、平らで低い土地の街。'}
 else if(h.flood.near){LOC.region='mountain';LOC.why='川の近くの街。少し歩けば、山も見えてきます。'}
 else{LOC.region='town';LOC.why='家が多く集まる街。'}}

// ---- 画面：住所を入れる → 結果 → 物語へ ----
const lmsg=(m,err)=>{const d=$('#lmsg');d.hidden=!m;d.textContent=m||'';d.classList.toggle('err',!!err)};
function openLoc(){hide();$('#lin').hidden=false;$('#lres').hidden=true;lmsg('');$('#loc').hidden=false;$('#la').focus()}
async function runLoc(lat,lon,label){
 if(!(lat>20&&lat<46&&lon>122&&lon<154))return lmsg('日本国内の場所で試してください。',1);
 lmsg('地図を読みこんでいます…（10秒ほどかかることがあります）');['#ls','#lc'].forEach(s=>$(s).disabled=true);
 try{await analyze(lat,lon,label);showLocResult()}catch(e){lmsg('うまく読みこめませんでした。時間をおいて、もう一度試してください。',1)}
 ['#ls','#lc'].forEach(s=>$(s).disabled=false)}
function showLocResult(){lmsg('');$('#lin').hidden=true;
 $('#lres').innerHTML=`<div class="card"><h3>あなたの街</h3><b style="font-size:18px">${esc(LOC.town)}</b>のあたり<br>${LOC.why}${LOC.elev!=null?`<br><small>家のあたりの標高：約${Math.round(LOC.elev)}m</small>`:''}</div>
 <p style="line-height:1.7;margin:8px 0">この街は、物語では「<b>${REGION_NAME[LOC.region]}</b>」として始まります。<br>くわしい地図は、エンディングのあとで一緒に見られます。</p>
 <button class="btn" id="lgo" style="width:100%">この街で始める</button><button class="btn sub" id="lalt" style="width:100%">物語の街は、自分で選ぶ</button><button class="btn sub" id="lre" style="width:100%">場所を入れなおす</button>`;
 $('#lres').hidden=false;
 $('#lgo').onclick=()=>{$('#loc').hidden=true;begin($('#in').value.trim());st.region=LOC.region;play([...S.intro.slice(0,2),L('town','','{n}',S.localLine?S.localLine(LOC.town):'私の街は、'+LOC.town+'のあたり。'),...S[LOC.region+'_intro']])};
 $('#lalt').onclick=()=>{$('#loc').hidden=true;begin($('#in').value.trim());play(S.intro)};
 $('#lre').onclick=openLoc}
$('#lg').onclick=openLoc;
$('#lb').onclick=()=>{hide();$('#ti').hidden=false};
$('#ls').onclick=async()=>{const q=$('#la').value.trim();if(!q)return lmsg('住所を入れてください（町名までで大丈夫です）。',1);
 lmsg('住所を探しています…');try{const j=await fetch(GSI.search+encodeURIComponent(q)).then(r=>r.json());if(!j.length)return lmsg('その住所が見つかりませんでした。市区町村名から入れてみてください。',1);
  const[lon,lat]=j[0].geometry.coordinates;runLoc(lat,lon,j[0].properties.title)}catch(e){lmsg('住所を探せませんでした。通信を確認してください。',1)}};
$('#la').onkeydown=e=>{if(e.key=='Enter')$('#ls').click()};
$('#lc').onclick=()=>{if(!navigator.geolocation)return lmsg('この端末では現在地を使えません。住所を入れてください。',1);lmsg('現在地を確認しています…');
 navigator.geolocation.getCurrentPosition(p=>runLoc(p.coords.latitude,p.coords.longitude,''),()=>lmsg('現在地を取得できませんでした。住所を入れてください。',1),{timeout:10000,maximumAge:600000})};
{const og=$('#go').onclick;$('#go').onclick=()=>{LOC=null;og()}}   // ふつうに始めたときは、自分の街モードを解除

// ---- エンディングのあと：あなたの本当の街を歩く ----
const ASK={wataru:'{n}さん。…今度は、{n}さんが本当に暮らしている街も、歩いてみたいです。',
 ao:'{n}さんが本当に暮らしてる街の地図、今度、見せてもらえませんか。古い道とか、きっと面白いと思うんです。',
 yama1:'…{n}さんの本当の街にも、川は、ありますか。今度、見てみたいです。',
 yama2:'{n}さんの本当の街も、今度、案内してくれよ。歩くのは得意なんだ。',
 machi1:'{n}さんが本当に暮らしてる街も、いつか歩いてみたいです。おいしいお店、教えてくださいね。',
 machi2:'…{n}さんの本当の街。気が向いたら、案内してもらえますか。'};
const _ending=ending;
ending=function(t){_ending(t);if(!LOC)return;
 $('#en').insertAdjacentHTML('beforeend',`<div class="card home"><h3>あなたの本当の街</h3>${esc(LOC.town)}のあたりを、実際の地図で歩いてみよう。<button class="btn" id="lw" style="width:100%;margin-top:8px">あなたの街を歩く</button></div>`);
 $('#lw').onclick=walkHome};
function walkHome(){const c=CHARS[st.who],n=st.aff[st.who]||0,bitter=n<(c.th||[6,3])[1];hide();$('#en').hidden=true;
 buildHomeMap();
 play(bitter?[L('dusk','','','3日間は、あっという間に終わった。'),L('dusk','','{n}','…この街で見たものは、私が本当に暮らしている街にも、きっとある。',{map:'home'})]
  :[L('dusk',c.sym,c.name,ASK[st.who]||'今度は、{n}さんの街を案内してください。'),L('dusk','','','あなたの本当の街。今度の休みに、一緒に歩くとしたら？',{map:'home'})])}
function tileImgs(url,op){return tiles(LZ).map(t=>`<image href="${fill(url,{z:LZ,x:t.x,y:t.y})}" x="${t.dx}" y="${t.dy}" width="${t.sz}" height="${t.sz}" ${op?`opacity="${op}"`:''} onerror="this.remove()"/>`).join('')}
const credit=`<rect x="${VW-118}" y="${VH-18}" width="118" height="18" fill="#fffc"/><text x="${VW-6}" y="${VH-5}" text-anchor="end" font-size="10" style="font-weight:500">出典：国土地理院</text>`;
ICON.home=p=>`<g class="hm"><circle cx="${p.x}" cy="${p.y}" r="17" fill="#e5637b" stroke="#fff" stroke-width="3"/><path d="M${p.x-8} ${p.y+1}l8-8 8 8v8h-16z" fill="#fff"/></g>`;
function buildHomeMap(){const sp=LOC.spots;
 MAPS.home={title:'あなたの街',intro:'今度の休みに、一緒に歩くとしたら？ 行ってみたい場所を'+Math.min(3,sp.length)+'つ選ぼう。',need:Math.min(3,sp.length)||1,
  ask:undefined,go:'この道順で歩く',
  hint:()=>sp.length?'まん中の「家」が、あなたの家のあたり。地図の場所は、国土地理院のデータから選んでいます。':'このあたりでは、選べる場所が見つかりませんでした。',
  bg:`<rect width="${VW}" height="${VH}" fill="#eee"/>${tileImgs(GSI.pale)}${credit}`,
  spots:[...sp.map(p=>({...p,r:20,fs:16})),{id:'_home',icon:'home',x:HX,y:HY}],
  done:sel=>[L('dusk','','{n}','この道順。…地図で、もう少しだけ確かめておこう。',{then:()=>{reveal(sel)}})]};
 if(!sp.length)MAPS.home.done=()=>[L('dusk','','{n}','…地図で、もう少しだけ確かめておこう。',{then:()=>{reveal(new Set())}})]}

// 振り返り：ハザードを重ねた地図と、選んだ場所のメモ
function depthText(k,c){return c<0?null:LAYERS[k].leg[c][1]}
function spotText(p){const e=p.e!=null?`標高 約${Math.round(p.e)}m。`:'';
 if(p.kind=='evac')return `${esc(p.full)}。${p.types.length?p.types.join('・')+'のときの':''}指定緊急避難場所です。家から約${p.dist}m${p.edge?'（地図の外。マークの方向にあります）':''}。`;
 if(p.kind=='high')return `このあたりで高い場所（${e}家より約${Math.round(p.e-LOC.elev)}m高い）。水があふれたとき、高い所がどの方向にあるか知っておくと安心です。家から約${p.dist}m。`;
 if(p.kind=='low')return `このあたりで低い場所（${e}家より約${Math.round(LOC.elev-p.e)}m低い）。大雨のとき、水が集まりやすい場所です。家から約${p.dist}m。`;
 if(p.kind=='water')return `${LAYERS[p.layer].name}に、${depthText(p.layer,p.c)}の浸水が見込まれている場所。${e}家から約${p.dist}m。`;
 if(p.kind=='dosha')return `土砂災害の${depthText(p.layer,p.c)}（${LAYERS[p.layer].name}）。大雨のときは、斜面のそばから早めに離れる場所です。家から約${p.dist}m。`;
 return ''}
function homeText(){const h=LOC.hz,rows=[];
 [['flood','川があふれたとき'],['tide','高潮'],['tsunami','津波']].forEach(([k,n])=>{const x=h[k];if(!x.any)return;rows.push(`${n}：${x.home>=0?'家のあたりで '+depthText(k,x.home)+' の浸水想定':x.near?'家のすぐ近くまで浸水想定あり':'家のまわりでは想定なし（地図の範囲内に想定区域あり）'}`)});
 const d=['dosha1','dosha2','dosha3'].filter(k=>h[k].any);
 if(d.length)rows.push('土砂災害の区域：'+(d.some(k=>h[k].home>=0)?'家のあたりが区域内':d.some(k=>h[k].near)?'家のすぐ近くに区域あり':'地図の範囲内に区域あり')+'（'+d.map(k=>LAYERS[k].name).join('・')+'）');
 if(!rows.length)rows.push('この地図の範囲には、国土地理院で公開されている浸水・土砂災害の想定区域が見つかりませんでした。');
 return (LOC.elev!=null?`標高：約${Math.round(LOC.elev)}m<br>`:'')+rows.join('<br>')}
function reveal(sel){hide();$('#box').hidden=true;$('#sp').innerHTML='';$('#bg').className='dusk';
 const used=Object.keys(LAYERS).filter(k=>LOC.hz[k].any);
 const legend=used.map(k=>{const L=LAYERS[k];return `<span class="lg"><i style="background:#${L.leg[L.kind=='dosha'?0:1][0]}"></i>${L.name}</span>`}).join('');
 const mk=p=>`<g><circle cx="${p.x}" cy="${p.y}" r="17" fill="#fff" stroke="${sel.has(p.id)?'#e5637b':'#6b8896'}" stroke-width="${sel.has(p.id)?5:2}" opacity="${sel.has(p.id)?1:.75}"/><text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="14">${p.g}</text></g>`;
 const chosen=LOC.spots.filter(p=>sel.has(p.id)),others=LOC.spots.filter(p=>!sel.has(p.id));
 $('#lr').innerHTML=`<h2 style="margin:0">あなたの街のメモ</h2><p style="margin:4px 0">${esc(LOC.town)}のあたり。色の付いたところが、ハザードマップの想定区域です。</p>
 <svg viewBox="0 0 ${VW} ${VH}"><rect width="${VW}" height="${VH}" fill="#eee"/>${tileImgs(GSI.pale)}${used.map(k=>tileImgs(fill(GSI.hz,{l:LAYERS[k].l,z:'{z}',x:'{x}',y:'{y}'}),.6)).join('')}${LOC.spots.map(mk).join('')}${ICON.home({x:HX,y:HY})}${credit}</svg>
 <div class="legend">${legend||'<span class="lg">この範囲に想定区域なし</span>'}</div>
 <div class="card"><h3>家のあたり</h3>${homeText()}</div>
 ${chosen.map(p=>`<div class="card"><h3>${p.g}　${esc(p.n)}</h3>${spotText(p)}</div>`).join('')}
 ${others.length?`<h3 style="margin:16px 0 0">ほかの場所</h3>`+others.map(p=>`<div class="card no"><h3>${p.g}　${esc(p.n)}</h3>${spotText(p)}</div>`).join(''):''}
 <div class="card"><h3>このメモについて</h3>国土地理院のハザードマップポータルサイトで公開されているデータ（洪水・高潮・津波は想定最大規模）から作っています。<b>色が付いていない場所が安全、という意味ではありません。</b>想定が作られていない川や、内水氾濫（下水があふれる浸水）は含まれていないことがあります。お住まいの市区町村のハザードマップと、<a href="https://disaportal.gsi.go.jp/" target="_blank" rel="noopener">重ねるハザードマップ</a>でも確かめて、実際に歩いてみよう。</div>
 <button class="btn" style="width:100%" onclick="$('#lr').hidden=true;$('#rs').click()">タイトルへ</button>`;
 $('#lr').hidden=false;$('#lr').scrollTop=0}
