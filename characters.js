// キャラクター設定：キャラを増やす・変えるときはここだけ触る（名前は設定シートの表に合わせた）
// region: 出会う地域（sea=海 / mountain=山 / town=街）。プロローグで選んだ地域のキャラだけが案内役の選択肢に並ぶ
// sym   : セリフ中で立ち絵を指定する1文字（L('town','kr',…) の 'k' や 'r'）
// start : ルート最初のシーンID / end : エンドIDの接頭辞（○H=ハッピー ○N=ノーマル ○B=ビター）
// th    : [ハッピー以上, ノーマル以上]（それ未満はビター） / max : 好感度の表示上限
// img   : 立ち絵画像のパス（省略するとシルエット） / memo : そのルート固有の防災メモ
// area / age / traits / bosai : 設定メモ（動作には使わない）。bosai=暮らしの中に自然に出てくる防災要素
const CHARS={
wataru:{region:'sea',sym:'k',name:'航',full:'鳴海 航',blurb:'海沿いを歩いたり、街を眺めるのが好き',hair:'#1b1b22',coat:'#3d5a80',color:'#3d5a80',ready:true,start:'wa',end:'wend',th:[6,3],max:8,
 area:'海（坂のある海沿い）',age:'20代後半',traits:'穏やかな性格・散歩好き。転職先の候補がこの街にある',bosai:'高台の景色／津波避難場所の標識',
 memo:[{k:'learned',t:'津波避難場所のマーク',b:'津波のときに逃げる場所を示す緑の標識。街歩きのときに、近くの標識と高さのある場所を探しておこう。'}]},
ao:{region:'sea',sym:'r',name:'碧',full:'潮崎 碧',blurb:'店や昔の街の姿を探すのが好き',hair:'#9a6a3c',coat:'#d08a4a',color:'#c07a3a',ready:true,start:'ao_start',end:'ao_end',th:[8,4],max:12,
 area:'海（平らな埋立地）',age:'30前後',traits:'食べ歩きと古い地図が好き。古地図の仕事をこの街で始めたい',bosai:'昔は水辺だった街の成り立ち／ハザードマップを地図として眺める',
 memo:[{k:'waterfound',t:'街の成り立ちを知る',b:'いま住んでいる場所が、昔は海や川だったかどうかは、古い地図で調べられる。埋め立てた土地は揺れや浸水の影響を受けやすいことがあるので、市のハザードマップと見比べてみよう。'}]},
yama1:{region:'mountain',sym:'a',name:'楓',full:'楓（姓は未定）',blurb:'無口だけど、川や空の変化によく気づく',hair:'#2d3a2e',coat:'#5a8f7b',color:'#5a8f7b',ready:true,start:'yama1_start',end:'yama1_end',th:[7,3],max:12,
 area:'山',age:'20代半ば',traits:'無口・釣りや星空が好き。川の近くで働ける場所を探している',bosai:'川や山の様子の変化に気づく',
 memo:[{k:'rivernote',t:'川の様子に気づく',b:'川の色や水の量、橋の柱に残る水の跡は、天気や上流の様子を知る手がかりになる。雨のあとに川を見る習慣をつけ、市の防災情報も見ておこう。'}]},
yama2:{region:'mountain',sym:'b',name:'暁',full:'暁（姓は未定）',blurb:'何でもそろえている、アウトドア好きの頼れる人',hair:'#5a3a2a',coat:'#8b6a3a',color:'#8b6a3a',ready:true,start:'yama2_start',end:'yama2_end',th:[7,3],max:12,
 area:'山',age:'30代半ば',traits:'頼れる・キャンプ道具や保存食が日常にある',bosai:'道具や食料を日常的に持っている',
 memo:[{k:'gear',t:'いつもの道具が、備えになる',b:'ライト、ラジオ、日持ちする食料は、アウトドアにも暮らしにも役立つ。手回し充電式や電池式を家にも置いて、場所を家族で共有しておこう。'}]},
machi1:{region:'town',sym:'c',name:'灯',full:'灯（姓は未定）',blurb:'食堂を継ぐか迷っている、世話好きな人',hair:'#7a3b2b',coat:'#b0644b',color:'#b0644b',ready:true,start:'machi1_start',end:'machi1_end',th:[7,3],max:12,
 area:'住宅密集地',age:'20代後半',traits:'食堂の家の子・世話好き',bosai:'路地や近所づきあい／昔の火事の話',
 memo:[{k:'alleynote',t:'路地の知恵と、近所の顔',b:'広場や細い抜け道、路地の消火器や、顔見知りの近所づきあいは、いざという時の助けになる。まず歩いて、どこに何があるかを確かめておこう。'}]},
machi2:{region:'town',sym:'d',name:'澄',full:'澄（姓は未定）',blurb:'皮肉屋で、ガジェットと一人の時間が好き',hair:'#232a3a',coat:'#4a8fa8',color:'#4a8fa8',ready:true,start:'machi2_start',end:'machi2_end',th:[7,3],max:12,
 area:'住宅密集地',age:'30代前半',traits:'在宅勤務・一人暮らし・皮肉屋・ガジェット好き',bosai:'備えは面倒と思っている→少しずつ変わっていく役',
 memo:[{k:'carry',t:'いつものカバンに、少しだけ',b:'モバイルバッテリー、ライト、水や食べ物など、普段の持ち物に少しだけ足しておくと、停電や帰宅困難のときに役立つ。無理のない範囲で、カバンに入れておこう。'}]}
};
