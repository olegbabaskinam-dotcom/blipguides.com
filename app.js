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
/* игры запускаются, только когда блок появился на экране */
function whenSeen(el,fn){ if(!('IntersectionObserver' in window)) return fn();
  var o=new IntersectionObserver(function(es){ if(es[0].isIntersecting){o.disconnect(); fn()} },{rootMargin:'300px'}); o.observe(el); }

/* игра 1: «Скопировали или придумали?» */
var G=document.querySelector('.game1');
if(G){
  var N=10, round=[], qi=0, score=0, cur=null, cat='';
  function start(){load(G.dataset.src,function(d){if(cat)d=d.filter(function(x){return x.s===cat}); round=shuffle(d).slice(0,Math.min(N,d.length)); qi=0; score=0;
    G.querySelector('.g-end').hidden=true; G.querySelector('.g-stage').hidden=false; ask()})}
  function ask(){cur=round[qi];
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    G.querySelector('.g-q').innerHTML='<div class="g-row"><p><span class="g-l g-lg">В игре:</span> <b>'+esc(cap(cur.gq))+'</b></p><p class="g-ctx">'+esc(cur.gd)+'</p></div><div class="g-row"><p><span class="g-l g-lr">В жизни:</span> <b>'+esc(cap(cur.rq))+'</b></p><p class="g-ctx">'+esc(cur.rd)+'</p></div><p class="g-ask">Насколько Rockstar скопировала?</p>';
    G.querySelector('.g-img').innerHTML='<figure><img src="'+IMG(cur.g)+'" alt="GTA 6: '+esc(cur.gq)+'"><figcaption>GTA 6</figcaption></figure><figure><img src="'+IMG(cur.r)+'" alt="Прототип: '+esc(cur.rq)+'"><figcaption>Прототип</figcaption></figure>';
    G.querySelector('.g-ans').hidden=true; G.querySelectorAll('.g-opts button').forEach(function(b){b.disabled=false;b.className=''});
  }
  function end(){var n=round.length, t=score===n?'ты знаешь Флориду лучше Rockstar 🔥':score>=n*0.8?'отлично, ты почти местный во Флориде!':score>=n*0.5?'неплохо, но Rockstar пару раз тебя провела.':'Rockstar обвела тебя вокруг пальца. Попробуй ещё раз!';
    finish(G,score,n,t,'Я угадал '+score+' из '+n+' в игре «Скопировали или придумали?» — GTA 6 и реальность',start)}
  G.querySelector('.g-opts').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!cur||b.disabled)return;
    var ok=b.dataset.v===cur.v; if(ok)score++;
    G.querySelectorAll('.g-opts button').forEach(function(x){x.disabled=true; if(x.dataset.v===cur.v)x.className='right'; else if(x===b)x.className='wrong'});
    var a=G.querySelector('.g-ans'); a.hidden=false; var last=qi>=round.length-1;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Правильный ответ — «<b style="color:'+VC[cur.v]+'">'+esc(cur.vn)+'</b>».</p><p class="g-why"><b>Почему «'+esc(cur.vn)+'»:</b> '+esc(cur.why)+'</p>'+(cur.cr?'<p class="g-cr">Реальное фото: '+esc(cur.cr.replace(/^Фото: /,''))+'</p>':'')+'<div class="g-btns"><a class="btn btn2" href="'+BASE+cur.u+'">Читать сравнение →</a><button class="btn g-nx" type="button">'+(last?'Узнать результат →':'Следующий вопрос →')+'</button></div>';
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    a.querySelector('.g-nx').addEventListener('click',function(){if(last)end(); else{qi++;ask()}});
  });
  var GC=G.querySelector('.g-cat');
  if(GC)GC.addEventListener('click',function(e){var b=e.target.closest('button'); if(!b)return; cat=b.dataset.s;
    GC.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)}); start()});
  whenSeen(G,start);
}

/* игра 2: «Кто или где это?» (справочник) */
var H=document.querySelector('.game2');
if(H){
  var R2=[], i2=0, s2=0, c2=null, ALL=[];
  function start2(){load(H.dataset.src,function(d){ALL=d; var seen={}, pool=shuffle(d).filter(function(x){if(seen[x.a]>=2)return false; seen[x.a]=(seen[x.a]||0)+1; return true});
    R2=pool.slice(0,Math.min(10,pool.length)); i2=0; s2=0; H.querySelector('.g-end').hidden=true; H.querySelector('.g-stage').hidden=false; ask2()})}
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
    var ok=b.dataset.a===c2.a; if(ok)s2++;
    H.querySelectorAll('.g2-opts button').forEach(function(x){x.disabled=true; if(x.dataset.a===c2.a)x.className='right'; else if(x===b)x.className='wrong'});
    var a=H.querySelector('.g-ans'); a.hidden=false; var last=i2>=R2.length-1;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Это — <b>'+esc(c2.a)+'</b>.</p><p class="g-why">'+esc(c2.d)+'</p><div class="g-btns"><a class="btn btn2" href="'+BASE+c2.u+'">Открыть в справочнике →</a><button class="btn g-nx" type="button">'+(last?'Узнать результат →':'Следующий вопрос →')+'</button></div>';
    H.querySelector('.g-score').textContent='Вопрос '+(i2+1)+' из '+R2.length+' · угадано '+s2;
    a.querySelector('.g-nx').addEventListener('click',function(){if(last)end2(); else{i2++;ask2()}});
  });
  function end2(){var n=R2.length, t=s2===n?'ты знаешь Леониду наизусть 🔥':s2>=n*0.8?'отлично, к релизу готов!':s2>=n*0.5?'неплохо — загляни в справочник перед релизом.':'самое время изучить справочник!';
    finish(H,s2,n,t,'Я угадал '+s2+' из '+n+' в игре «Кто или где это?» — справочник GTA 6',start2)}
  whenSeen(H,start2);
}

/* появление блоков при прокрутке */
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.door,.soon4,.ccard,.tile,.chc').forEach(function(el){el.classList.add('rv');io.observe(el)})}
})();
