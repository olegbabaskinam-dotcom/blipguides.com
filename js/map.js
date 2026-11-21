/* Blip Guides — интерактивная карта Леониды (21.11.2026). Подложка — официальная карта Rockstar Games. */
(function(){
var W=1052,H=1440,DATA=null,LOAD=null;
function css(h){var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l)}
function js(s,cb){var e=document.createElement('script');e.src=s;e.onload=cb;document.head.appendChild(e)}
function leaflet(cb){if(window.L)return cb();if(LOAD){LOAD.push(cb);return}LOAD=[cb];css('/js/leaflet/leaflet.css');js('/js/leaflet/leaflet.js',function(){LOAD.forEach(function(f){f()})})}
function data(cb){if(DATA)return cb(DATA);fetch('/map.json').then(function(r){return r.json()}).then(function(d){DATA=d;cb(d)})}
function ll(x,y){return [H-y,x]}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function init(box){
  data(function(D){leaflet(function(){build(box,D)})});
}
function build(box,D){
  var cats=D.cats, CM={}; cats.forEach(function(c){CM[c.k]=c});
  var only=box.dataset.c?box.dataset.c.split(','):null;          // какие категории показывать кнопками
  var start=box.dataset.on||'';                                    // какая включена сразу
  var sub=box.dataset.f||'';                                       // фильтр внутри категории (группа g)
  var pin=box.dataset.pin||'';                                     // одна метка (страница миссии)
  var bar=document.createElement('div');bar.className='lm-bar';
  var mapEl=document.createElement('div');mapEl.className='lm-map';
  var note=document.createElement('p');note.className='lm-note';
  note.innerHTML='Карта: Rockstar Games (официальная карта Леониды). Метки с пометкой «примерно» стоят по району, а не по точному адресу.';
  box.appendChild(bar);box.appendChild(mapEl);box.appendChild(note);
  var map=L.map(mapEl,{crs:L.CRS.Simple,minZoom:-1,maxZoom:2,zoomSnap:.25,attributionControl:false,maxBounds:[[-200,-200],[H+200,W+200]]});
  var B=[[0,0],[H,W]];
  var sm=L.imageOverlay('/img/map/leonida-sm.webp',B).addTo(map),full=null;
  map.on('zoomend',function(){if(!full&&map.getZoom()>=.75){full=L.imageOverlay('/img/map/leonida.webp',B).addTo(map)}});
  var foc=box.dataset.focus;
  if(foc){var p=foc.split(',').map(Number);map.setView(ll(p[0],p[1]),p[2]||0.5)}else map.fitBounds([[H-1380,40],[H-60,1010]]);
  var layer=L.layerGroup().addTo(map);
  var used={};D.m.forEach(function(m){used[m.c]=(used[m.c]||0)+1});
  var list=(only||cats.map(function(c){return c.k})).filter(function(k){return used[k]});
  function btn(k,t,n,col){var b=document.createElement('button');b.type='button';b.dataset.k=k;b.innerHTML=(col?'<i style="background:'+col+'"></i>':'')+esc(t)+(n?' <small>'+n+'</small>':'');bar.appendChild(b);return b}
  var buttons=[btn('','Без меток')];
  list.forEach(function(k){buttons.push(btn(k,CM[k].n,used[k],CM[k].col))});
  var subbar=null;
  function show(k){
    buttons.forEach(function(b){b.classList.toggle('on',b.dataset.k===k)});var _a=bar.querySelector('.on');if(_a)bar.scrollLeft=Math.max(0,_a.offsetLeft-bar.offsetLeft-12);
    layer.clearLayers(); if(subbar){subbar.remove();subbar=null}
    if(!k)return;
    var per=box.dataset.p||'';var ms=D.m.filter(function(m){return m.c===k&&(!pin||m.u===pin)&&(!per||(m.p||[]).indexOf(per)>=0)});
    var groups=[];ms.forEach(function(m){if(m.g&&groups.indexOf(m.g)<0)groups.push(m.g)});
    var cur=(sub&&groups.indexOf(sub)>=0)?sub:'';
    if(groups.length>1&&!pin){
      subbar=document.createElement('div');subbar.className='lm-sub';bar.after(subbar);
      ['Все'].concat(groups).forEach(function(g){var b=document.createElement('button');b.type='button';b.textContent=g;if((g==='Все'&&!cur)||g===cur)b.className='on';
        b.onclick=function(){cur=g==='Все'?'':g;[].forEach.call(subbar.children,function(x){x.classList.toggle('on',x===b)});draw()};subbar.appendChild(b)});
    }
    function draw(){
      layer.clearLayers();var c=CM[k];
      ms.forEach(function(m){if(cur&&m.g!==cur)return;
        var shape=m.r?L.circle(ll(m.x,m.y),{radius:m.r,color:c.col,weight:1,fillOpacity:.25}):L.circleMarker(ll(m.x,m.y),{radius:pin?9:7,color:'#fff',weight:2,fillColor:c.col,fillOpacity:1});
        var h='<b>'+esc(m.n)+'</b>'+(m.d?'<br><span>'+esc(m.d)+'</span>':'')+(m.a?'<br><em>примерно — по району</em>':'')+(m.u?'<br><a href="/'+m.u+'">Подробнее →</a>':'');
        shape.bindPopup(h).addTo(layer)});
      if(pin&&ms[0]){map.setView(ll(ms[0].x,ms[0].y),.5)}
    }
    draw();
    try{if(box.dataset.home){var u=new URL(location);if(k)u.searchParams.set('map',k);else u.searchParams.delete('map');history.replaceState(null,'',u)}}catch(e){}
  }
  buttons.forEach(function(b){b.onclick=function(){show(b.dataset.k)}});
  var q='';try{q=new URLSearchParams(location.search).get('map')||''}catch(e){}
  show(box.dataset.home&&q&&used[q]?q:start);
}
function boot(){
  var boxes=document.querySelectorAll('.lmap');if(!boxes.length)return;
  if(!('IntersectionObserver' in window)){[].forEach.call(boxes,init);return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);init(e.target)}})},{rootMargin:'400px'});
  [].forEach.call(boxes,function(b){io.observe(b)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
