/* Blip Guides: поиск, фильтры, слайдер, игра «Угадай вердикт» */
(function(){
var S=document.currentScript, BASE=new URL('./',S.src).href, DATA=null, waiters=[];
function data(cb){ if(DATA) return cb(DATA); waiters.push(cb); if(waiters.length>1) return;
  fetch(BASE+'search.json').then(function(r){return r.json()}).then(function(d){DATA=d; waiters.forEach(function(f){f(d)}); waiters=[]}).catch(function(){}); }
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().replace(/ё/g,'е')}
var VC={copy:'#2ecc71',motiv:'#F5C518',parody:'#C645F0',orig:'#3AA0FF'};

/* слайдер игра/реальность */
document.querySelectorAll('.cmpx input').forEach(function(i){i.addEventListener('input',function(){i.parentNode.style.setProperty('--pos',i.value+'%')})});

/* поиск */
var sb=document.querySelector('.sbtn-s');
if(sb){
  var box=document.createElement('div'); box.className='srch'; box.hidden=true;
  box.innerHTML='<div class="srch-in w"><input type="search" placeholder="Поиск: место, машина, бренд…" aria-label="Поиск по сайту"><button class="srch-x" aria-label="Закрыть">✕</button></div><div class="srch-res w"></div>';
  document.body.appendChild(box);
  var inp=box.querySelector('input'), res=box.querySelector('.srch-res');
  function open(){box.hidden=false; document.body.classList.add('srch-on'); inp.focus(); data(function(){run()})}
  function close(){box.hidden=true; document.body.classList.remove('srch-on')}
  function run(){
    var q=norm(inp.value.trim()); if(!DATA){return}
    if(q.length<2){res.innerHTML='<p class="srch-hint">Начните вводить: «Майами», «игуана», «BMW», «пародия»…</p>';return}
    var w=q.split(/\s+/), out=DATA.filter(function(d){var t=norm(d.h+' '+d.q+' '+d.sn+' '+d.rn+' '+d.vn); return w.every(function(x){return t.indexOf(x)>-1})});
    res.innerHTML=out.length?out.slice(0,12).map(function(d){return '<a class="srch-it" href="'+BASE+d.u+'"><img src="'+BASE+'img/'+d.g+'-sm.jpg" alt="" loading="lazy"><span><b>'+esc(d.h)+'</b><i style="--v:'+VC[d.v]+'">'+esc(d.vn)+'</i> · '+esc(d.sn)+' · '+esc(d.rn)+'</span></a>'}).join(''):'<p class="srch-hint">Ничего не нашли. Попробуйте другое слово.</p>';
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

/* игра «Скопировали или придумали?»: раунд из 10 вопросов */
var G=document.querySelector('.game');
if(G){
  var N=10, round=[], qi=0, score=0, cur=null;
  function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function start(){data(function(d){round=shuffle(d).slice(0,Math.min(N,d.length)); qi=0; score=0;
    G.querySelector('.g-end').hidden=true; G.querySelector('.g-stage').hidden=false; ask()})}
  function ask(){cur=round[qi];
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    G.querySelector('.g-q').innerHTML='<p><span class="g-l g-lg">В игре:</span> '+esc(cap(cur.gq))+'</p><p><span class="g-l g-lr">В жизни:</span> '+esc(cap(cur.rq))+'</p><p class="g-ask">Насколько Rockstar скопировала?</p>';
    G.querySelector('.g-img').innerHTML='<figure><img src="'+BASE+'img/'+cur.g+'.jpg" alt="GTA 6: '+esc(cur.gq)+'"><figcaption>GTA 6</figcaption></figure><figure><img src="'+BASE+'img/'+cur.r+'.jpg" alt="Прототип: '+esc(cur.rq)+'"><figcaption>Прототип</figcaption></figure>';
    G.querySelector('.g-ans').hidden=true; G.querySelectorAll('.g-opts button').forEach(function(b){b.disabled=false;b.className=''});
  }
  function end(){G.querySelector('.g-stage').hidden=true; var e=G.querySelector('.g-end'); e.hidden=false;
    var n=round.length, t=score===n?'ты знаешь Флориду лучше Rockstar 🔥':score>=n*0.8?'отлично, ты почти местный во Флориде!':score>=n*0.5?'неплохо, но Rockstar пару раз тебя провела.':'Rockstar обвела тебя вокруг пальца. Попробуй ещё раз!';
    G.querySelector('.g-score').textContent='Раунд окончен';
    e.innerHTML='<p class="g-big">'+score+' из '+n+'</p><p class="g-msg">'+cap(t)+'</p><div class="g-btns"><button class="btn g-again" type="button">Сыграть ещё</button><button class="btn btn2 g-share" type="button">Поделиться результатом</button></div>';
    e.querySelector('.g-again').addEventListener('click',start);
    e.querySelector('.g-share').addEventListener('click',function(){var txt='Я угадал '+score+' из '+n+' в игре «Скопировали или придумали?» — GTA 6 и реальная жизнь',u=BASE;
      if(navigator.share){navigator.share({title:'Blip Guides',text:txt,url:u}).catch(function(){})}
      else if(navigator.clipboard){navigator.clipboard.writeText(txt+' '+u).then(function(){var b=e.querySelector('.g-share');b.textContent='Ссылка скопирована ✓'})}});
  }
  G.querySelector('.g-opts').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!cur||b.disabled)return;
    var ok=b.dataset.v===cur.v; if(ok)score++;
    G.querySelectorAll('.g-opts button').forEach(function(x){x.disabled=true; if(x.dataset.v===cur.v)x.className='right'; else if(x===b)x.className='wrong'});
    var a=G.querySelector('.g-ans'); a.hidden=false; var last=qi>=round.length-1;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Это «<b style="color:'+VC[cur.v]+'">'+esc(cur.vn)+'</b>».</p><p>'+esc(cur.n)+'</p><div class="g-btns"><a class="btn btn2" href="'+BASE+cur.u+'">Читать сравнение →</a><button class="btn g-nx" type="button">'+(last?'Узнать результат →':'Следующий вопрос →')+'</button></div>';
    G.querySelector('.g-score').textContent='Вопрос '+(qi+1)+' из '+round.length+' · угадано '+score;
    a.querySelector('.g-nx').addEventListener('click',function(){if(last)end(); else{qi++;ask()}});
  });
  start();
}
})();
