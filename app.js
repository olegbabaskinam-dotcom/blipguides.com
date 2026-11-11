/* Blip Guides: поиск, фильтры, слайдер, игры «Скопировали или придумали?» и «Кто или где это?» */
(function(){
var S=document.currentScript, BASE=new URL('./',S.src).href, CACHE={};
function load(name,cb){ var c=CACHE[name]; if(c&&c.d) return cb(c.d); if(!c){c=CACHE[name]={w:[]};
  fetch(BASE+name).then(function(r){return r.json()}).then(function(d){c.d=d; c.w.forEach(function(f){f(d)}); c.w=[]}).catch(function(){})}
  c.w.push(cb); }
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().replace(/ё/g,'е')}
function IMG(n,sm){return BASE+'img/'+n+(sm?'-sm':'')+'.webp'}
function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var VC={copy:'#2ecc71',motiv:'#F5C518',parody:'#C645F0',orig:'#3AA0FF'};

/* слайдер игра/реальность */
document.querySelectorAll('.cmpx input').forEach(function(i){i.addEventListener('input',function(){i.parentNode.style.setProperty('--pos',i.value+'%')})});

/* поиск (данные грузятся только при открытии) */
var sb=document.querySelector('.sbtn-s');
if(sb){
  var DATA=null, box=document.createElement('div'); box.className='srch'; box.hidden=true;
  box.innerHTML='<div class="srch-in w"><input type="search" placeholder="Поиск: персонаж, место, машина, бренд…" aria-label="Поиск по сайту"><button class="srch-x" aria-label="Закрыть">✕</button></div><div class="srch-res w"></div>';
  document.body.appendChild(box);
  var inp=box.querySelector('input'), res=box.querySelector('.srch-res');
  function open(){box.hidden=false; document.body.classList.add('srch-on'); inp.focus(); load('search.json',function(d){DATA=d; run()})}
  function close(){box.hidden=true; document.body.classList.remove('srch-on')}
  function run(){
    var q=norm(inp.value.trim()); if(!DATA){return}
    if(q.length<2){res.innerHTML='<p class="srch-hint">Начните вводить: «Лусия», «Майами», «игуана», «BMW», «пародия»…</p>';return}
    var w=q.split(/\s+/), out=DATA.filter(function(d){var t=norm(d.h+' '+d.q+' '+d.sn+' '+d.rn+' '+(d.vn||'')); return w.every(function(x){return t.indexOf(x)>-1})});
    res.innerHTML=out.length?out.slice(0,12).map(function(d){return '<a class="srch-it" href="'+BASE+d.u+'"><img src="'+IMG(d.g,1)+'" alt="" loading="lazy"><span><b>'+esc(d.h)+'</b>'+(d.v?'<i style="--v:'+VC[d.v]+'">'+esc(d.vn)+'</i> · ':'')+esc(d.sn)+(d.rn?' · '+esc(d.rn):'')+'</span></a>'}).join(''):'<p class="srch-hint">Ничего не нашли. Попробуйте другое слово.</p>';
  }
  sb.addEventListener('click',open); box.querySelector('.srch-x').addEventListener('click',close);
  inp.addEventListener('input',run);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden)close(); if(e.key==='/'&&box.hidden&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();open()}});
  box.addEventListener('click',function(e){if(e.target===box)close()});
}

/* фильтры */
var F=document.querySelector('.filt');
if(F){
  var st={s:'',r:'',v:''}, P=new URLSearchParams(location.search);
  ['s','r','v'].forEach(function(k){if(P.get(k))st[k]=P.get(k)});
  var cards=document.querySelectorAll('.cgrid.all .ccard'), cnt=F.querySelector('.fcount b');
  function apply(){
    F.querySelectorAll('button[data-g]').forEach(function(b){b.classList.toggle('on',st[b.dataset.g]===b.dataset.f)});
    var n=0; cards.forEach(function(c){var ok=(!st.s||c.dataset.s===st.s)&&(!st.r||c.dataset.r===st.r)&&(!st.v||c.dataset.v===st.v); c.hidden=!ok; if(ok)n++});
    if(cnt)cnt.textContent=n;
    var e=document.querySelector('.fempty'); if(e)e.hidden=n>0;
    var q=new URLSearchParams(); ['s','r','v'].forEach(function(k){if(st[k])q.set(k,st[k])});
    var qs=q.toString(); history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);
  }
  F.addEventListener('click',function(e){var b=e.target.closest('button[data-g]'); if(!b)return; st[b.dataset.g]=b.dataset.f; apply()});
  var rs=F.querySelector('.freset'); if(rs)rs.addEventListener('click',function(){st={s:'',r:'',v:''};apply()});
  apply();
}

/* общий конец раунда */
function finish(G,score,n,msg,share,again){
  G.querySelector('.g-stage').hidden=true; var e=G.querySelector('.g-end'); e.hidden=false;
  G.querySelector('.g-score').textContent='Раунд окончен';
  e.innerHTML='<p class="g-big">'+score+' из '+n+'</p><p class="g-msg">'+cap(msg)+'</p><div class="g-btns"><button class="btn g-again" type="button">Сыграть ещё</button><button class="btn btn2 g-share" type="button">Поделиться результатом</button></div>';
  e.querySelector('.g-again').addEventListener('click',again);
  e.querySelector('.g-share').addEventListener('click',function(){var u=BASE;
    if(navigator.share){navigator.share({title:'Blip Guides',text:share,url:u}).catch(function(){})}
    else if(navigator.clipboard){navigator.clipboard.writeText(share+' '+u).then(function(){e.querySelector('.g-share').textContent='Ссылка скопирована ✓'})}});
}
/* после «Следующий вопрос» — вернуть начало игры на экран */
function toTop(el){var y=el.getBoundingClientRect().top+window.pageYOffset-70; if(Math.abs(window.pageYOffset-y)>40) window.scrollTo({top:y,behavior:'smooth'})}
/* игры запускаются, только когда блок появился на экране */
function whenSeen(el,fn){ if(!('IntersectionObserver' in window)) return fn();
  var o=new IntersectionObserver(function(es){ if(es[0].isIntersecting){o.disconnect(); fn()} },{rootMargin:'300px'}); o.observe(el); }

/* свёрнутые игры: «Сыграть» / «Свернуть», состояние в браузере */
document.querySelectorAll('.gfold').forEach(function(f){var k='bg-fold-'+f.dataset.k,b=f.querySelector('.gbody'),o=f.querySelector('.gopen'),c=f.querySelector('.gclose');
  var on=false;
  function set(v,save){on=v; b.hidden=!v; o.classList.toggle('on',v); o.setAttribute('aria-expanded',v?'true':'false'); o.querySelector('.ga').textContent=v?'Свернуть ▲':'Играть ▼'; if(save)try{localStorage.setItem(k,v?'1':'0')}catch(e){}}
  var v=false; try{v=localStorage.getItem(k)==='1'}catch(e){} set(v);
  o.addEventListener('click',function(){set(!on,1)}); c.addEventListener('click',function(){set(false,1); toTop(f)});
});
function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function lsSet(k,v){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
/* игра 1: «Скопировали или придумали?» */
var G=document.querySelector('.game1');
if(G){
  var N=10, round=[], qi=0, score=0, cur=null, cat='';
  function start(fresh){var st=fresh?null:lsGet('bg-g1');
    if(st&&st.r&&st.q<st.r.length){round=st.r; qi=st.q; score=st.s; G.querySelector('.g-end').hidden=true; G.querySelector('.g-stage').hidden=false; ask(); return}
    load(G.dataset.src,function(d){if(cat)d=d.filter(function(x){return x.s===cat}); round=shuffle(d).slice(0,Math.min(N,d.length)); qi=0; score=0; lsSet('bg-g1',{r:round,q:0,s:0});
    G.querySelector('.g-end').hidden=true; G.querySelector('.g-stage').hidden=false; ask()})}
  function ask(){cur=round[qi];
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    G.querySelector('.g-q').innerHTML='<div class="g-row"><p><span class="g-l g-lg">В игре:</span> <b>'+esc(cap(cur.gq))+'</b></p><p class="g-ctx">'+esc(cur.gd)+'</p></div><div class="g-row"><p><span class="g-l g-lr">В жизни:</span> <b>'+esc(cap(cur.rq))+'</b></p><p class="g-ctx">'+esc(cur.rd)+'</p></div><p class="g-ask">Насколько Rockstar скопировала?</p>';
    G.querySelector('.g-img').innerHTML='<figure><img src="'+IMG(cur.g)+'" alt="GTA 6: '+esc(cur.gq)+'"><figcaption>GTA 6</figcaption></figure><figure><img src="'+IMG(cur.r)+'" alt="Прототип: '+esc(cur.rq)+'"><figcaption>Прототип</figcaption></figure>';
    G.querySelector('.g-ans').hidden=true; G.querySelectorAll('.g-opts button').forEach(function(b){b.disabled=false;b.className=''});
  }
  function end(){var n=round.length, t=score===n?'ты знаешь Флориду лучше Rockstar 🔥':score>=n*0.8?'отлично, ты почти местный во Флориде!':score>=n*0.5?'неплохо, но Rockstar пару раз тебя провела.':'Rockstar обвела тебя вокруг пальца. Попробуй ещё раз!';
    lsSet('bg-g1',null); finish(G,score,n,t,'Я угадал '+score+' из '+n+' в игре «Скопировали или придумали?» — GTA 6 и реальность',start)}
  G.querySelector('.g-opts').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!cur||b.disabled)return;
    var ok=b.dataset.v===cur.v; if(ok)score++; lsSet('bg-g1',{r:round,q:qi+1,s:score});
    G.querySelectorAll('.g-opts button').forEach(function(x){x.disabled=true; if(x.dataset.v===cur.v)x.className='right'; else if(x===b)x.className='wrong'});
    var a=G.querySelector('.g-ans'); a.hidden=false; var last=qi>=round.length-1;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Правильный ответ — «<b style="color:'+VC[cur.v]+'">'+esc(cur.vn)+'</b>».</p><p class="g-why"><b>Почему «'+esc(cur.vn)+'»:</b> '+esc(cur.why)+'</p>'+(cur.cr?'<p class="g-cr">Реальное фото: '+esc(cur.cr.replace(/^Фото: /,''))+'</p>':'')+'<div class="g-btns"><a class="btn btn2" href="'+BASE+cur.u+'">Читать сравнение →</a><button class="btn g-nx" type="button">'+(last?'Узнать результат →':'Следующий вопрос →')+'</button></div>';
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    a.querySelector('.g-nx').addEventListener('click',function(){this.blur(); if(last)end(); else{qi++;ask()} toTop(G)});
  });
  var GC=G.querySelector('.g-cat');
  if(GC)GC.addEventListener('click',function(e){var b=e.target.closest('button'); if(!b)return; cat=b.dataset.s;
    GC.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)}); start(true)});
  whenSeen(G,function(){start()});
}

/* игра 2: «Кто или где это?» (справочник) */
var H=document.querySelector('.game2');
if(H){
  var R2=[], i2=0, s2=0, c2=null, ALL=[];
  function start2(fresh){var st=fresh?null:lsGet('bg-g2');
    if(st&&st.r&&st.q<st.r.length){load(H.dataset.src,function(d){ALL=d; R2=st.r; i2=st.q; s2=st.s; H.querySelector('.g-end').hidden=true; H.querySelector('.g-stage').hidden=false; ask2()}); return}
    load(H.dataset.src,function(d){ALL=d; var seen={}, pool=shuffle(d).filter(function(x){if(seen[x.a]>=2)return false; seen[x.a]=(seen[x.a]||0)+1; return true});
    R2=pool.slice(0,Math.min(10,pool.length)); i2=0; s2=0; lsSet('bg-g2',{r:R2,q:0,s:0}); H.querySelector('.g-end').hidden=true; H.querySelector('.g-stage').hidden=false; ask2()})}
  function ask2(){c2=R2[i2];
    H.querySelector('.g-score').textContent='Вопрос '+(i2+1)+' из '+R2.length+' · угадано '+s2;
    H.querySelector('.g2-img').innerHTML='<img src="'+IMG(c2.i)+'" alt="Кадр GTA 6">';
    H.querySelector('.g-ask').textContent=c2.t==='ch'?'Кто это?':'Какой это регион Леониды?';
    var names={}; ALL.forEach(function(x){if(x.t===c2.t&&x.a!==c2.a)names[x.a]=1});
    var opts=shuffle(shuffle(Object.keys(names)).slice(0,3).concat([c2.a]));
    H.querySelector('.g2-opts').innerHTML=opts.map(function(o){return '<button type="button" data-a="'+esc(o)+'">'+esc(o)+'</button>'}).join('');
    H.querySelector('.g-ans').hidden=true;
  }
  H.querySelector('.g2-opts').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!c2||b.disabled)return;
    var ok=b.dataset.a===c2.a; if(ok)s2++; lsSet('bg-g2',{r:R2,q:i2+1,s:s2});
    H.querySelectorAll('.g2-opts button').forEach(function(x){x.disabled=true; if(x.dataset.a===c2.a)x.className='right'; else if(x===b)x.className='wrong'});
    var a=H.querySelector('.g-ans'); a.hidden=false; var last=i2>=R2.length-1;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Это — <b>'+esc(c2.a)+'</b>.</p><p class="g-why">'+esc(c2.d)+'</p><div class="g-btns"><a class="btn btn2" href="'+BASE+c2.u+'">Открыть в справочнике →</a><button class="btn g-nx" type="button">'+(last?'Узнать результат →':'Следующий вопрос →')+'</button></div>';
    H.querySelector('.g-score').textContent='Вопрос '+(i2+1)+' из '+R2.length+' · угадано '+s2;
    a.querySelector('.g-nx').addEventListener('click',function(){this.blur(); if(last)end2(); else{i2++;ask2()} toTop(H)});
  });
  function end2(){var n=R2.length, t=s2===n?'ты знаешь Леониду наизусть 🔥':s2>=n*0.8?'отлично, к релизу готов!':s2>=n*0.5?'неплохо — загляни в справочник перед релизом.':'самое время изучить справочник!';
    lsSet('bg-g2',null); finish(H,s2,n,t,'Я угадал '+s2+' из '+n+' в игре «Кто или где это?» — справочник GTA 6',start2)}
  whenSeen(H,function(){start2()});
}

/* появление блоков при прокрутке */
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.door,.soon4,.ccard,.tile,.chc').forEach(function(el){el.classList.add('rv');io.observe(el)})}
})();

/* Просмотр фото: тап → на весь экран, приближение (щипок, колёсико, двойной тап), перетаскивание, закрыть — ✕, фон, Esc, «Назад» */
(function(){
var SKIP='a,.logo,.cmpx,.cmpr,.srch-it,.lb';
function ok(img){return img&&img.tagName==='IMG'&&!img.closest(SKIP)&&(img.naturalWidth||img.width)>=120}
var st=document.createElement('style');
st.textContent='.lb-z{cursor:zoom-in}.lb{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.94);display:none;touch-action:none;overscroll-behavior:contain}.lb.on{display:block}.lb img{position:absolute;left:50%;top:50%;max-width:100vw;max-height:100vh;max-height:100dvh;transform-origin:center;user-select:none;-webkit-user-drag:none;will-change:transform;cursor:zoom-in}.lb.zm img{cursor:grab}.lb-x{position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;z-index:2;width:48px;height:48px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:400 30px/48px sans-serif;cursor:pointer}.lb-x:hover{background:rgba(255,255,255,.3)}.lb-c{position:absolute;left:0;right:0;bottom:0;padding:12px 16px max(14px,env(safe-area-inset-bottom));color:#ddd;font:14px/1.4 Manrope,sans-serif;text-align:center;background:linear-gradient(transparent,rgba(0,0,0,.75));pointer-events:none}.lb-c:empty{display:none}body.lb-open{overflow:hidden}';
document.head.appendChild(st);
var L=document.createElement('div');L.className='lb';L.setAttribute('role','dialog');L.setAttribute('aria-modal','true');
L.innerHTML='<img alt=""><button class="lb-x" type="button" aria-label="Закрыть">×</button><div class="lb-c"></div>';
var I=L.querySelector('img'),C=L.querySelector('.lb-c'),s=1,x=0,y=0,pts={},pd=0,ps=1,px=0,py=0,moved=false,lastTap=0,hist=false;
function upd(){I.style.transform='translate(-50%,-50%) translate('+x+'px,'+y+'px) scale('+s+')';L.classList.toggle('zm',s>1.01)}
function clamp(){var w=I.offsetWidth*s,h=I.offsetHeight*s,mx=Math.max(0,(w-innerWidth)/2),my=Math.max(0,(h-innerHeight)/2);x=Math.min(mx,Math.max(-mx,x));y=Math.min(my,Math.max(-my,y))}
function zoomAt(ns,cx,cy){ns=Math.min(6,Math.max(1,ns));var dx=cx-innerWidth/2-x,dy=cy-innerHeight/2-y;x-=dx*(ns/s-1);y-=dy*(ns/s-1);s=ns;if(s===1){x=y=0}clamp();upd()}
function full(src){return src.replace(/-sm\.(webp|jpg|png)(\?.*)?$/,'.$1')}
function open(img){var src=img.currentSrc||img.src;I.src=src;var f=full(src);if(f!==src){var p=new Image();p.onload=function(){if(L.classList.contains('on'))I.src=f};p.src=f}
  var fc=img.closest('figure');fc=fc&&fc.querySelector('figcaption');C.textContent=fc?fc.textContent:(img.alt||'');
  s=1;x=y=0;upd();if(!L.parentNode)document.body.appendChild(L);L.classList.add('on');document.body.classList.add('lb-open');
  try{history.pushState({lb:1},'');hist=true}catch(e){hist=false}}
function shut(fromPop){if(!L.classList.contains('on'))return;L.classList.remove('on');document.body.classList.remove('lb-open');I.removeAttribute('src');if(hist&&!fromPop){hist=false;history.back()}hist=false}
addEventListener('popstate',function(){if(L.classList.contains('on'))shut(true)});
document.addEventListener('click',function(e){var t=e.target;if(ok(t)){e.preventDefault();open(t)}});
function mark(){document.querySelectorAll('img').forEach(function(i){if(!i.closest(SKIP))i.classList.add('lb-z')})}
mark();setTimeout(mark,1500);
L.querySelector('.lb-x').addEventListener('click',function(e){e.stopPropagation();shut()});
addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
L.addEventListener('wheel',function(e){e.preventDefault();zoomAt(s*(e.deltaY<0?1.2:1/1.2),e.clientX,e.clientY)},{passive:false});
L.addEventListener('pointerdown',function(e){if(e.target.closest('.lb-x'))return;L.setPointerCapture&&L.setPointerCapture(e.pointerId);pts[e.pointerId]={x:e.clientX,y:e.clientY};moved=false;var k=Object.keys(pts);
  if(k.length===2){var a=pts[k[0]],b=pts[k[1]];pd=Math.hypot(a.x-b.x,a.y-b.y);ps=s}px=e.clientX;py=e.clientY});
L.addEventListener('pointermove',function(e){if(!pts[e.pointerId])return;var k=Object.keys(pts);
  if(k.length===2){pts[e.pointerId]={x:e.clientX,y:e.clientY};var a=pts[k[0]],b=pts[k[1]],d=Math.hypot(a.x-b.x,a.y-b.y);if(pd){zoomAt(ps*d/pd,(a.x+b.x)/2,(a.y+b.y)/2)}moved=true;return}
  var dx=e.clientX-px,dy=e.clientY-py;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(s>1){x+=dx;y+=dy;clamp();upd()}px=e.clientX;py=e.clientY;pts[e.pointerId]={x:e.clientX,y:e.clientY}});
function up(e){var was=Object.keys(pts).length;delete pts[e.pointerId];pd=0;if(was>1||moved||e.type==='pointercancel')return;
  var now=Date.now();if(now-lastTap<300){lastTap=0;zoomAt(s>1.01?1:2.5,e.clientX,e.clientY);return}lastTap=now;
  if(e.target!==I&&s<=1.01){var t=now;setTimeout(function(){if(lastTap===t)shut()},300)}}
L.addEventListener('pointerup',up);L.addEventListener('pointercancel',up);
})();
