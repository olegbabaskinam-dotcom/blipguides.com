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

/* игра «Угадай вердикт» */
var G=document.querySelector('.game');
if(G){
  var score=0, total=0, cur=null, last=[];
  function pick(d){var pool=d.filter(function(x){return last.indexOf(x.u)<0}); if(!pool.length){last=[];pool=d}
    var x=pool[Math.floor(Math.random()*pool.length)]; last.push(x.u); if(last.length>Math.min(8,d.length-1))last.shift(); return x}
  function show(){data(function(d){cur=pick(d);
    G.querySelector('.g-img').innerHTML='<figure><img src="'+BASE+'img/'+cur.g+'.jpg" alt="Кадр GTA 6"><figcaption>Игра</figcaption></figure><figure><img src="'+BASE+'img/'+cur.r+'.jpg" alt="Реальное фото"><figcaption>Реальность</figcaption></figure>';
    G.querySelector('.g-q').innerHTML='<b>'+esc(cur.h)+'</b>';
    G.querySelector('.g-ans').hidden=true; G.querySelectorAll('.g-opts button').forEach(function(b){b.disabled=false;b.className=''});
  })}
  G.querySelector('.g-opts').addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!cur||b.disabled)return;
    var ok=b.dataset.v===cur.v; total++; if(ok)score++;
    G.querySelectorAll('.g-opts button').forEach(function(x){x.disabled=true; if(x.dataset.v===cur.v)x.className='right'; else if(x===b)x.className='wrong'});
    var a=G.querySelector('.g-ans'); a.hidden=false;
    a.innerHTML='<p class="g-res">'+(ok?'✓ Верно!':'✗ Не угадали.')+' Вердикт: <b style="color:'+VC[cur.v]+'">'+esc(cur.vn)+'</b></p><p>'+esc(cur.n)+'</p><a class="btn btn2" href="'+BASE+cur.u+'">Читать сравнение →</a>';
    G.querySelector('.g-score').textContent='Угадано '+score+' из '+total;
  });
  G.querySelector('.g-next').addEventListener('click',show);
  show();
}
})();
