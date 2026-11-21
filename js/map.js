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
  var buttons=[btn('','Без меток'),btn('*','Все метки')];
  list.forEach(function(k){buttons.push(btn(k,CM[k].n,used[k],CM[k].col))});
  var sel=[],subbar=null,cur='';
  function popup(m){return (m.i?'<img class="lm-ph" src="/img/'+m.i+'-sm.jpg" alt="'+esc(m.n)+'" loading="lazy">':'')+'<b>'+esc(m.n)+'</b>'+(m.d?'<br><span>'+esc(m.d)+'</span>':'')+(m.a?'<br><em>примерно — по району</em>':'')+(m.u?'<br><a href="/'+m.u+'">Подробнее →</a>':'')}
  function pick(){var per=box.dataset.p||'';return D.m.filter(function(m){return sel.indexOf(m.c)>=0&&(!pin||m.u===pin)&&(!per||(m.p||[]).indexOf(per)>=0)})}
  function draw(){
    layer.clearLayers();var ms=pick();
    ms.forEach(function(m){if(cur&&m.g!==cur)return;var c=CM[m.c],h=popup(m);
      if(m.poly){L.polygon(m.poly.map(function(q){return ll(q[0],q[1])}),{color:c.col,weight:2,fillOpacity:.18,dashArray:'6 4'}).bindPopup(h,{maxWidth:240}).addTo(layer)}
      else if(m.r){L.circle(ll(m.x,m.y),{radius:m.r,color:c.col,weight:2,fillOpacity:.18,dashArray:'6 4'}).bindPopup(h,{maxWidth:240}).addTo(layer)}
      L.circleMarker(ll(m.x,m.y),{radius:pin?9:7,color:'#fff',weight:2,fillColor:c.col,fillOpacity:1}).bindPopup(h,{maxWidth:240}).addTo(layer)});
    if(pin&&ms[0]){map.setView(ll(ms[0].x,ms[0].y),.5)}
  }
  function render(){
    var all=sel.length===list.length;
    buttons.forEach(function(b){var k=b.dataset.k;b.classList.toggle('on',k===''?!sel.length:k==='*'?all&&list.length>1:sel.indexOf(k)>=0)});
    if(subbar){subbar.remove();subbar=null}
    if(sel.length===1&&!pin){
      var groups=[];pick().forEach(function(m){if(m.g&&groups.indexOf(m.g)<0)groups.push(m.g)});
      if(cur&&groups.indexOf(cur)<0)cur='';
      if(groups.length>1){
        subbar=document.createElement('div');subbar.className='lm-sub';bar.after(subbar);
        ['Все'].concat(groups).forEach(function(g){var b=document.createElement('button');b.type='button';b.textContent=g;if((g==='Все'&&!cur)||g===cur)b.className='on';
          b.onclick=function(){cur=g==='Все'?'':g;[].forEach.call(subbar.children,function(x){x.classList.toggle('on',x===b)});draw()};subbar.appendChild(b)});
      }
    }else cur='';
    draw();
    try{if(box.dataset.home){var u=new URL(location);if(sel.length)u.searchParams.set('map',all?'all':sel.join(','));else u.searchParams.delete('map');history.replaceState(null,'',u)}}catch(e){}
  }
  buttons.forEach(function(b){b.onclick=function(){var k=b.dataset.k;
    if(k==='')sel=[];else if(k==='*')sel=list.slice();
    else{var i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else sel.push(k)}
    cur='';render()}});
  var q='';try{q=new URLSearchParams(location.search).get('map')||''}catch(e){}
  if(box.dataset.home&&q){sel=q==='all'?list.slice():q.split(',').filter(function(k){return list.indexOf(k)>=0})}
  else if(start)sel=start.split(',').filter(function(k){return list.indexOf(k)>=0});
  if(sub&&sel.length===1)cur=sub;
  render();
  var _a=bar.querySelector('button.on:not([data-k=""])');if(_a)bar.scrollLeft=Math.max(0,_a.offsetLeft-bar.offsetLeft-12);
}
function boot(){
  var boxes=document.querySelectorAll('.lmap');if(!boxes.length)return;
  if(!('IntersectionObserver' in window)){[].forEach.call(boxes,init);return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);init(e.target)}})},{rootMargin:'400px'});
  [].forEach.call(boxes,function(b){io.observe(b)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
