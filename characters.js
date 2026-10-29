// キャラクター設定（大学生・引っ越してくる版：6人とも、この街で暮らす大学の先輩）：キャラを増やす・変えるときはここだけ触る（名前は設定シートの表に合わせた）
// region: 出会う地域（sea=海 / mountain=山 / town=街）。プロローグで選んだ地域のキャラだけが案内役の選択肢に並ぶ
// sym   : セリフ中で立ち絵を指定する1文字（L('town','kr',…) の 'k' や 'r'）
// start : ルート最初のシーンID / end : エンドIDの接頭辞（○H=ハッピー ○N=ノーマル ○B=ビター）
// th    : [ハッピー以上, ノーマル以上]（それ未満はビター） / max : 好感度の表示上限
// img   : 立ち絵画像のパス。省略すると art.js の仮の絵。表情ごとに分けるときは img:{normal:'img/wataru.png',smile:'img/wataru_smile.png',shy:'…',trouble:'…'} / memo : そのルート固有の防災メモ
// area / age / traits / bosai : 設定メモ（動作には使わない）。bosai=暮らしの中に自然に出てくる防災要素
const CHARS={
wataru:{region:'sea',sym:'k',name:'航',full:'鳴海 航',blurb:'3年生。散歩と、高いところからの景色が好き',hair:'#1b1b22',coat:'#3d5a80',color:'#3d5a80',ready:true,start:'wa',end:'wend',th:[6,3],max:8,
 area:'海（坂のある海沿い）',age:'大学3年（21）',traits:'穏やかで、人に合わせるのが上手すぎる。就職をこの街でするか迷っている',bosai:'高台の景色／津波避難場所の標識',
 memo:[{k:'learned',t:'津波避難場所のマーク',b:'津波のときに逃げる場所を示す緑の標識。街歩きのときに、近くの標識と高さのある場所を探しておこう。'}]},
ao:{region:'sea',sym:'r',name:'碧',full:'潮崎 碧',blurb:'4年生。古い地図と食べ歩きが好き',hair:'#9a6a3c',coat:'#d08a4a',color:'#c07a3a',ready:true,start:'ao_start',end:'ao_end',th:[8,4],max:12,
 area:'海（平らな埋立地）',age:'大学4年（22）',traits:'地理学専攻。子どもの頃は転校ばかり。大学からこの街に来て4年目',bosai:'昔は水辺だった街の成り立ち／ハザードマップを地図として眺める',
 memo:[{k:'waterfound',t:'街の成り立ちを知る',b:'いま住んでいる場所が、昔は海や川だったかどうかは、古い地図で調べられる。埋め立てた土地は揺れや浸水の影響を受けやすいことがあるので、市のハザードマップと見比べてみよう。'}]},
yama1:{region:'mountain',sym:'a',name:'楓',full:'楓（姓は未定）',blurb:'2年生。無口だけど、川や空の変化によく気づく',hair:'#2d3a2e',coat:'#5a8f7b',color:'#5a8f7b',ready:true,start:'yama1_start',end:'yama1_end',th:[7,3],max:12,
 area:'山',age:'大学2年（20）',traits:'環境学科。無口。祖父に教わった釣りと、星空が好き',bosai:'川や山の様子の変化に気づく',
 memo:[{k:'rivernote',t:'川の様子に気づく',b:'川の色や水の量、橋の柱に残る水の跡は、天気や上流の様子を知る手がかりになる。雨のあとに川を見る習慣をつけ、市の防災情報も見ておこう。'}]},
yama2:{region:'mountain',sym:'b',name:'暁',full:'暁（姓は未定）',blurb:'4年生。何でもそろえている、頼れるアウトドア好き',hair:'#5a3a2a',coat:'#8b6a3a',color:'#8b6a3a',ready:true,start:'yama2_start',end:'yama2_end',th:[7,3],max:12,
 area:'山',age:'大学4年（22）',traits:'ワンダーフォーゲル部。アウトドア店でアルバイト。卒業後、この町でガイドの仕事を始めたい',bosai:'道具や食料を日常的に持っている',
 memo:[{k:'gear',t:'いつもの道具が、備えになる',b:'ライト、ラジオ、日持ちする食料は、アウトドアにも暮らしにも役立つ。手回し充電式や電池式を家にも置いて、場所を家族で共有しておこう。'}]},
machi1:{region:'town',sym:'c',name:'灯',full:'灯（姓は未定）',blurb:'2年生。路地の食堂の家の、世話好きな人',hair:'#7a3b2b',coat:'#b0644b',color:'#b0644b',ready:true,start:'machi1_start',end:'machi1_end',th:[7,3],max:12,
 area:'住宅密集地',age:'大学2年（20）',traits:'実家は路地の食堂。食堂を継ぐか、お菓子の道に進むか迷っている',bosai:'路地や近所づきあい／昔の火事の話',
 memo:[{k:'alleynote',t:'路地の知恵と、近所の顔',b:'広場や細い抜け道、路地の消火器や、顔見知りの近所づきあいは、いざという時の助けになる。まず歩いて、どこに何があるかを確かめておこう。'}]},
machi2:{region:'town',sym:'d',name:'澄',full:'澄（姓は未定）',blurb:'3年生。物静かで、喫茶店と一人の時間が好き',hair:'#232a3a',coat:'#4a8fa8',color:'#4a8fa8',ready:true,start:'machi2_start',end:'machi2_end',th:[7,3],max:12,
 area:'住宅密集地',age:'大学3年（21）',traits:'情報学科。一人暮らし。何でも一人で済ませてきた',bosai:'備えは面倒と思っている→少しずつ変わっていく役',
 memo:[{k:'carry',t:'いつものカバンに、少しだけ',b:'モバイルバッテリー、ライト、水や食べ物など、普段の持ち物に少しだけ足しておくと、停電や帰宅困難のときに役立つ。無理のない範囲で、カバンに入れておこう。'}]}
};
