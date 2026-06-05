// ── PAGE SWITCH ──────────────────────────────────
function showPage(p, btn) {
  document.querySelectorAll('.page').forEach(function(el){ el.style.display='none'; el.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(el){ el.classList.remove('active'); });
  var pg = document.getElementById('page-'+p);
  pg.style.display='flex'; pg.classList.add('active');
  btn.classList.add('active');
  // sidebar only on map page
  var isMap = (p==='map');
  document.getElementById('sidebar').style.display = isMap ? '' : 'none';
  document.getElementById('btn-sidebar').style.display = isMap ? '' : 'none';
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── MAP INIT ─────────────────────────────────────
var map = L.map("map",{zoomControl:false,maxZoom:18,minZoom:9}).setView([0.507,101.447],12);
L.control.zoom({position:"bottomright"}).addTo(map);
var autolinker = new Autolinker({truncate:{length:30,location:"smart"}});

map.on('zoomend',function(){ document.getElementById('sb-zoom').textContent=map.getZoom(); });

// Basemap – lebih terang
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
  opacity:0.9,
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  minZoom:1,maxZoom:19
}).addTo(map);

// ringan dark overlay agar tetap enak dibaca
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
  opacity:0.35,
  attribution:'© <a href="https://carto.com">CARTO</a>',
  subdomains:'abcd',maxZoom:20
}).addTo(map);

// ── KECAMATAN ────────────────────────────────────
var kecColors={
  "BUKITRAYA":"#e74c3c","LIMAPULUH":"#e67e22","MARPOYANDAMAI":"#f1c40f",
  "PAYUNGSEKAKI":"#2ecc71","PEKANBARUKOTA":"#1abc9c","RUMBAI":"#3498db",
  "RUMBAIPESISIR":"#9b59b6","SAIL":"#e91e63","SENAPELAN":"#00bcd4",
  "SUKAJADI":"#ff9800","TAMPAN":"#4caf50","TENAYANRAYA":"#2196f3"
};

map.createPane("pane_kec"); map.getPane("pane_kec").style.zIndex=401;
var layer_kec = new L.geoJson(json_ADMINISTRASIKECAMATAN_AR_50K_1,{
  pane:"pane_kec",interactive:true,
  style:function(f){
    var col=kecColors[f.properties["NAMOBJ"]]||"#2d7dd2";
    return{pane:"pane_kec",opacity:1,color:"rgba(255,255,255,0.4)",weight:1.5,fill:true,fillOpacity:0.25,fillColor:col,interactive:true};
  },
  onEachFeature:function(f,layer){
    var name=f.properties["NAMOBJ"]||"–";
    var col=kecColors[name]||"#2d7dd2";
    layer.bindPopup('<div style="font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;color:'+col+'">'+name+'</div><div style="font-size:11px;color:#7fa3c4;margin-top:3px;">Kecamatan Kota Pekanbaru</div>');
    layer.on('mouseover',function(){layer.setStyle({fillOpacity:0.45});});
    layer.on('mouseout',function(){layer.setStyle({fillOpacity:0.25});});
  }
}).addTo(map);

// ── POLSEK MARKERS ───────────────────────────────
map.createPane("pane_pol"); map.getPane("pane_pol").style.zIndex=500;
var featured=["Polresta Pekanbaru","Polda Riau"];
var polMarkers={};

function mkIcon(isFeat){
  return L.divIcon({
    className:'',
    html:'<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);'+
      'background:linear-gradient(135deg,'+(isFeat?'#f4a820,#c07800':'#2d7dd2,#1a3a6e')+');'+
      'border:2px solid '+(isFeat?'#ffd166':'#5ba4e5')+';'+
      'display:flex;align-items:center;justify-content:center;font-size:13px;'+
      'box-shadow:0 0 10px '+(isFeat?'rgba(244,168,32,.7)':'rgba(45,125,210,.6)')+';'+
      '"><span style="transform:rotate(45deg)">🛡</span></div>',
    iconSize:[30,30],iconAnchor:[15,30],popupAnchor:[0,-30]
  });
}

var layer_pol=new L.geoJson(json_polres1_2,{
  pane:"pane_pol",
  pointToLayer:function(f,latlng){
    return L.marker(latlng,{icon:mkIcon(featured.includes(f.properties["Nama"]||"")),pane:"pane_pol"});
  },
  onEachFeature:function(f,layer){
    var nama=f.properties["Nama"]||"–";
    var lat=f.properties["Latitude"];
    var lng=f.properties["Longitude"];
    layer.bindPopup(
      '<div style="font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;color:#f4a820;">'+nama+'</div>'+
      '<div style="font-size:11px;color:#7fa3c4;margin-top:3px;">📍 '+lat.toFixed(5)+', '+lng.toFixed(5)+'</div>'+
      '<div style="font-size:11px;color:#7fa3c4;">Kepolisian Kota Pekanbaru</div>'
    );
    layer.on('click',function(){ showInfo(nama,lat,lng); });
    polMarkers[nama]=layer;
  }
}).addTo(map);

// ── SIDEBAR POLSEK LIST ──────────────────────────
var allF=json_polres1_2.features;
var listEl=document.getElementById('polsek-list');

function buildList(features){
  listEl.innerHTML='';
  features.forEach(function(f){
    var nama=f.properties["Nama"]||"–";
    var lat=f.properties["Latitude"];
    var lng=f.properties["Longitude"];
    var isFeat=featured.includes(nama);
    var div=document.createElement('div');
    div.className='p-item'+(isFeat?' featured':'');
    div.innerHTML='<div class="p-icon">'+(isFeat?'⭐':'🛡')+'</div>'+
      '<div><div class="p-name">'+nama+'</div><div class="p-coord">'+lat.toFixed(4)+', '+lng.toFixed(4)+'</div></div>';
    div.addEventListener('click',function(){
      document.querySelectorAll('.p-item').forEach(function(i){i.classList.remove('active');});
      div.classList.add('active');
      map.setView([lat,lng],15);
      if(polMarkers[nama]) polMarkers[nama].openPopup();
      showInfo(nama,lat,lng);
    });
    listEl.appendChild(div);
  });
}
buildList(allF);

document.getElementById('search-input').addEventListener('input',function(){
  var q=this.value.toLowerCase();
  buildList(allF.filter(function(f){return (f.properties["Nama"]||"").toLowerCase().includes(q);}));
});

// ── KECAMATAN LIST ───────────────────────────────
var kecListEl=document.getElementById('kec-list');
Object.keys(kecColors).forEach(function(name){
  var div=document.createElement('div');
  div.className='kec-item';
  var label=name.charAt(0)+name.slice(1).toLowerCase().replace(/([a-z])([A-Z])/g,'$1 $2');
  div.innerHTML='<div class="kec-dot" style="background:'+kecColors[name]+'"></div><span>'+label+'</span>';
  div.addEventListener('click',function(){
    layer_kec.eachLayer(function(l){
      if(l.feature.properties["NAMOBJ"]===name){
        map.fitBounds(l.getBounds(),{padding:[40,40]});
        l.openPopup();
      }
    });
  });
  kecListEl.appendChild(div);
});

// ── LAYER TOGGLE ─────────────────────────────────
function toggleLayer(type,btn){
  btn.classList.toggle('on');
  if(type==='kec'){ if(map.hasLayer(layer_kec)) map.removeLayer(layer_kec); else map.addLayer(layer_kec); }
  else{ if(map.hasLayer(layer_pol)) map.removeLayer(layer_pol); else map.addLayer(layer_pol); }
}

// ── INFO PANEL ───────────────────────────────────
function showInfo(nama,lat,lng){
  document.getElementById('ip-title').textContent=nama;
  document.getElementById('ip-body').innerHTML=
    '<b>Koordinat:</b><br>📍 Lat: '+lat.toFixed(5)+'<br>📍 Lng: '+lng.toFixed(5)+'<br>'+
    '<br><span style="color:var(--accent2)">Kepolisian Kota Pekanbaru</span>';
  document.getElementById('info-panel').classList.remove('hidden');
}
function closeInfo(){ document.getElementById('info-panel').classList.add('hidden'); }

// ── INFO PAGE TABLE ──────────────────────────────
function getType(nama){
  if(nama.includes('Polda')) return '<span class="type-badge type-polda">Polda</span>';
  if(nama.includes('Polresta')||nama.includes('Polrestabel')) return '<span class="type-badge type-polres">Polres</span>';
  if(nama.includes('Satlantas')) return '<span class="type-badge type-satuan">Satlantas</span>';
  if(nama.includes('Kawasan')) return '<span class="type-badge type-satuan">Kawasan</span>';
  if(nama.includes('Subsektor')) return '<span class="type-badge type-satuan">Subsektor</span>';
  return '<span class="type-badge type-polsek">Polsek</span>';
}
var tbody=document.getElementById('info-table-body');
allF.forEach(function(f,i){
  var nama=f.properties["Nama"]||"–";
  var lat=f.properties["Latitude"];
  var lng=f.properties["Longitude"];
  var tr=document.createElement('tr');
  tr.innerHTML='<td>'+(i+1)+'</td><td>'+nama+'</td><td>'+getType(nama)+'</td>'+
    '<td>'+lat.toFixed(5)+'</td><td>'+lng.toFixed(5)+'</td>'+
    '<td><button onclick="lihatPeta('+lat+','+lng+',\''+nama+'\')" style="padding:3px 10px;border-radius:6px;background:rgba(45,125,210,.15);border:1px solid rgba(45,125,210,.3);color:#5ba4e5;cursor:pointer;font-size:11px;font-family:Exo 2,sans-serif;">Lihat Peta</button></td>';
  tbody.appendChild(tr);
});

function lihatPeta(lat,lng,nama){
  // switch to map page
  document.querySelectorAll('.nav-tab').forEach(function(el){el.classList.remove('active');});
  document.querySelector('.nav-tab').classList.add('active');
  showPage('map', document.querySelectorAll('.nav-tab')[0]);
  setTimeout(function(){
    map.setView([lat,lng],15);
    if(polMarkers[nama]) polMarkers[nama].openPopup();
    showInfo(nama,lat,lng);
  },100);
}

// ── LOADING ──────────────────────────────────────
setTimeout(function(){
  document.getElementById('loading').classList.add('out');
  setTimeout(function(){ document.getElementById('loading').style.display='none'; },500);
},1700);


// ── PURE CSS MODAL HELPERS ───────────────────────
function crudModalOpen(id){
  document.getElementById(id).classList.add('open');
  document.body.style.overflow='hidden';
}
function crudModalClose(id){
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow='';
}
// close on overlay click
document.addEventListener('click', function(e){
  if(e.target.classList.contains('s-overlay')){
    e.target.classList.remove('open');
    document.body.style.overflow='';
  }
});

// ══════════════════════════════════════════════════
// CRUD – DATA KOORDINAT
// ══════════════════════════════════════════════════

var CRUD_KEY = 'sipolis_koordinat';
var CRUD_DEFAULT = [
  {id:1, nama:'Polresta Pekanbaru',     kec:'Sukajadi',       lat:0.54283,  lng:101.44445, status:'Polresta'},
  {id:2, nama:'Polda Riau',             kec:'Bukit Raya',     lat:0.50701,  lng:101.44723, status:'Polda'},
  {id:3, nama:'Polsek Sukajadi',        kec:'Sukajadi',       lat:0.54610,  lng:101.43900, status:'Polsek'},
  {id:4, nama:'Polsek Bukit Raya',      kec:'Bukit Raya',     lat:0.49500,  lng:101.45800, status:'Polsek'},
  {id:5, nama:'Polsek Payung Sekaki',   kec:'Payung Sekaki',  lat:0.51200,  lng:101.39800, status:'Polsek'},
  {id:6, nama:'Polsek Senapelan',       kec:'Senapelan',      lat:0.55300,  lng:101.44100, status:'Polsek'},
  {id:7, nama:'Polsek Lima Puluh',      kec:'Lima Puluh',     lat:0.55800,  lng:101.46200, status:'Polsek'},
  {id:8, nama:'Polsek Rumbai',          kec:'Rumbai',         lat:0.58900,  lng:101.45700, status:'Polsek'},
  {id:9, nama:'Polsek Rumbai Barat',    kec:'Rumbai Barat',   lat:0.58200,  lng:101.43500, status:'Polsek'},
  {id:10,nama:'Polsek Binawidya',       kec:'Binawidya',      lat:0.47800,  lng:101.36900, status:'Polsek'},
  {id:11,nama:'Polsek Tenayan Raya',    kec:'Tenayan Raya',   lat:0.52400,  lng:101.49300, status:'Polsek'},
  {id:12,nama:'Polsek Marpoyan Damai',  kec:'Marpoyan Damai', lat:0.48100,  lng:101.43500, status:'Polsek'},
  {id:13,nama:'Polsek Kulim',           kec:'Tenayan Raya',   lat:0.50900,  lng:101.50200, status:'Polsek'},
  {id:14,nama:'Satlantas Polresta PKU', kec:'Sukajadi',       lat:0.54350,  lng:101.44200, status:'Satlantas'},
];

var crudData = [];
var crudEditId = null;
var crudDelId = null;
var crudViewItem = null;
var crudQ = '';
var crudSt = '';

function crudLoad(){
  try{
    var d=localStorage.getItem(CRUD_KEY);
    crudData = d ? JSON.parse(d) : JSON.parse(JSON.stringify(CRUD_DEFAULT));
  }catch(e){ crudData = JSON.parse(JSON.stringify(CRUD_DEFAULT)); }
}
function crudSaveStore(){ localStorage.setItem(CRUD_KEY, JSON.stringify(crudData)); }
function crudNextId(){ return crudData.length ? Math.max.apply(null,crudData.map(function(d){return d.id;})) + 1 : 1; }

// ── STATUS BADGE ─────────────────────────────────
function stBadge(s){
  var map={Polresta:'polresta',Polda:'polda',Polsek:'polsek',Satlantas:'satlantas'};
  var cls=map[s]||'lainnya';
  return '<span class="st-badge st-'+cls+'">'+s+'</span>';
}

// ── FILTERED ─────────────────────────────────────
function crudFiltered(){
  return crudData.filter(function(d){
    var q=crudQ.toLowerCase();
    var mq=!q||d.nama.toLowerCase().includes(q)||d.kec.toLowerCase().includes(q);
    var ms=!crudSt||d.status===crudSt;
    return mq&&ms;
  });
}

// ── RENDER TABLE ─────────────────────────────────
function crudRender(){
  var rows=crudFiltered();
  var tbody=document.getElementById('crud-tbody');
  var empty=document.getElementById('crud-empty');
  var info=document.getElementById('crud-info');

  if(!rows.length){
    tbody.innerHTML='';
    empty.style.display='block';
    info.textContent='Tidak ada data';
  } else {
    empty.style.display='none';
    info.textContent='Menampilkan '+rows.length+' dari '+crudData.length+' data';
    tbody.innerHTML=rows.map(function(d,i){
      return '<tr>'+
        '<td style="color:var(--text2)">'+(i+1)+'</td>'+
        '<td>'+d.nama+'</td>'+
        '<td style="color:var(--text2)">'+d.kec+'</td>'+
        '<td><span class="coord-mono">'+d.lat.toFixed(5)+'</span></td>'+
        '<td><span class="coord-mono">'+d.lng.toFixed(5)+'</span></td>'+
        '<td>'+stBadge(d.status)+'</td>'+
        '<td style="white-space:nowrap">'+
          '<button class="tbl-btn tbl-btn-view" onclick="crudOpenDetail('+d.id+')" title="Detail">👁</button> '+
          '<button class="tbl-btn tbl-btn-edit" onclick="crudOpenEdit('+d.id+')" title="Edit">✏</button> '+
          '<button class="tbl-btn tbl-btn-del" onclick="crudOpenDel('+d.id+')" title="Hapus">🗑</button>'+
        '</td>'+
      '</tr>';
    }).join('');
  }

  // mini stats
  var total=crudData.length;
  var polsek=crudData.filter(function(d){return d.status==='Polsek';}).length;
  var kec=[...new Set(crudData.map(function(d){return d.kec;}))].length;
  document.getElementById('crud-stats').innerHTML=[
    {n:total, l:'Total Satuan'},
    {n:kec,   l:'Kecamatan'},
    {n:polsek,l:'Polsek'},
  ].map(function(s){
    return '<div class="sb-stat"><div class="sb-stat-num">'+s.n+'</div><div class="sb-stat-lbl">'+s.l+'</div></div>';
  }).join('');
}

// ── SEARCH / FILTER ───────────────────────────────
document.getElementById('d-search').addEventListener('input',function(){crudQ=this.value;crudRender();});
document.getElementById('d-filter').addEventListener('change',function(){crudSt=this.value;crudRender();});

// ── ADD ───────────────────────────────────────────
function crudOpenAdd(){
  crudEditId=null;
  document.getElementById('crudFormTitle').textContent='Tambah Data Koordinat';
  ['cf-nama','cf-lat','cf-lng','cf-kec'].forEach(function(id){
    var el=document.getElementById(id); el.value=''; el.classList.remove('is-invalid');
  });
  document.getElementById('cf-status').value='Polsek';
  crudUpdatePreview();
  crudModalOpen('crudFormModal');
}

// ── EDIT ──────────────────────────────────────────
function crudOpenEdit(id){
  var d=crudData.find(function(x){return x.id===id;});
  if(!d) return;
  crudEditId=id;
  document.getElementById('crudFormTitle').textContent='Edit Data Koordinat';
  document.getElementById('cf-nama').value=d.nama;
  document.getElementById('cf-kec').value=d.kec;
  document.getElementById('cf-status').value=d.status;
  document.getElementById('cf-lat').value=d.lat;
  document.getElementById('cf-lng').value=d.lng;
  ['cf-nama','cf-lat','cf-lng','cf-kec'].forEach(function(id){document.getElementById(id).classList.remove('is-invalid');});
  crudUpdatePreview();
  crudModalOpen('crudFormModal');
}

// ── SAVE ──────────────────────────────────────────
function crudSave(){
  var nama=document.getElementById('cf-nama').value.trim();
  var kec=document.getElementById('cf-kec').value.trim();
  var lat=parseFloat(document.getElementById('cf-lat').value);
  var lng=parseFloat(document.getElementById('cf-lng').value);
  var st=document.getElementById('cf-status').value;
  var ok=true;
  if(!nama){document.getElementById('cf-nama').classList.add('is-invalid');ok=false;}
  else document.getElementById('cf-nama').classList.remove('is-invalid');
  if(!kec){document.getElementById('cf-kec').classList.add('is-invalid');ok=false;}
  else document.getElementById('cf-kec').classList.remove('is-invalid');
  if(isNaN(lat)||lat<-90||lat>90){document.getElementById('cf-lat').classList.add('is-invalid');ok=false;}
  else document.getElementById('cf-lat').classList.remove('is-invalid');
  if(isNaN(lng)||lng<-180||lng>180){document.getElementById('cf-lng').classList.add('is-invalid');ok=false;}
  else document.getElementById('cf-lng').classList.remove('is-invalid');
  if(!ok) return;

  if(crudEditId!==null){
    var idx=crudData.findIndex(function(x){return x.id===crudEditId;});
    crudData[idx]={id:crudEditId,nama:nama,kec:kec,lat:lat,lng:lng,status:st};
    crudToast('Data berhasil diperbarui!','success');
  } else {
    crudData.push({id:crudNextId(),nama:nama,kec:kec,lat:lat,lng:lng,status:st});
    crudToast('Data berhasil ditambahkan!','success');
  }
  crudSaveStore();
  crudModalClose('crudFormModal');
  crudRender();
}

// ── DELETE ────────────────────────────────────────
function crudOpenDel(id){
  var d=crudData.find(function(x){return x.id===id;});
  if(!d) return;
  crudDelId=id;
  document.getElementById('del-name').textContent=d.nama;
  crudModalOpen('crudDelModal');
}
document.getElementById('btn-del-confirm').addEventListener('click',function(){
  crudData=crudData.filter(function(x){return x.id!==crudDelId;});
  crudSaveStore();
  crudToast('Data berhasil dihapus.','danger');
  crudModalClose('crudDelModal');
  crudRender();
});

// ── DETAIL ────────────────────────────────────────
function crudOpenDetail(id){
  var d=crudData.find(function(x){return x.id===id;});
  if(!d) return;
  crudViewItem=d;
  document.getElementById('cd-nama').textContent=d.nama;
  document.getElementById('cd-kec').textContent=d.kec;
  document.getElementById('cd-lat').textContent=d.lat.toFixed(6);
  document.getElementById('cd-lng').textContent=d.lng.toFixed(6);
  document.getElementById('cd-coord').textContent=d.lat.toFixed(5)+', '+d.lng.toFixed(5);
  document.getElementById('cd-status').innerHTML=stBadge(d.status);
  document.getElementById('cd-gmaps').href='https://www.google.com/maps?q='+d.lat+','+d.lng;
  document.getElementById('cd-map').innerHTML=
    '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox='+(d.lng-.01)+','+(d.lat-.008)+','+(d.lng+.01)+','+(d.lat+.008)+'&layer=mapnik&marker='+d.lat+','+d.lng+'" style="width:100%;height:100%;border:none;" loading="lazy"></iframe>';
  crudModalOpen('crudDetailModal');
}

function crudCopyCoord(){
  if(!crudViewItem) return;
  navigator.clipboard.writeText(crudViewItem.lat.toFixed(6)+', '+crudViewItem.lng.toFixed(6));
  crudToast('Koordinat disalin!','info');
}

function crudFlyTo(){
  if(!crudViewItem) return;
  crudModalClose('crudDetailModal');
  showPage('map', document.querySelectorAll('.nav-tab')[0]);
  document.querySelectorAll('.nav-tab').forEach(function(el){el.classList.remove('active');});
  document.querySelectorAll('.nav-tab')[0].classList.add('active');
  setTimeout(function(){
    map.setView([crudViewItem.lat, crudViewItem.lng],15);
    showInfo(crudViewItem.nama, crudViewItem.lat, crudViewItem.lng);
  },150);
}

// ── COORD PREVIEW ────────────────────────────────
function crudUpdatePreview(){
  var lat=parseFloat(document.getElementById('cf-lat').value);
  var lng=parseFloat(document.getElementById('cf-lng').value);
  var prev=document.getElementById('cf-prev');
  var mapD=document.getElementById('cf-map-prev');
  if(!isNaN(lat)&&!isNaN(lng)){
    prev.innerHTML='<span class="lbl">lat</span> '+lat.toFixed(6)+'&nbsp;&nbsp;<span class="lbl">lng</span> '+lng.toFixed(6);
    mapD.innerHTML='<iframe src="https://www.openstreetmap.org/export/embed.html?bbox='+(lng-.008)+','+(lat-.006)+','+(lng+.008)+','+(lat+.006)+'&layer=mapnik&marker='+lat+','+lng+'" style="width:100%;height:100%;border:none;" loading="lazy"></iframe>';
  } else {
    prev.innerHTML='<span class="lbl">lat</span> – &nbsp;&nbsp; <span class="lbl">lng</span> –';
    mapD.innerHTML='<span>🗺 Masukkan koordinat untuk preview</span>';
  }
}

// ── EXPORT CSV ────────────────────────────────────
function crudExportCSV(){
  var header='No,Nama,Kecamatan,Latitude,Longitude,Status';
  var rows=crudData.map(function(d,i){return [i+1,d.nama,d.kec,d.lat,d.lng,d.status].join(',');});
  var blob=new Blob([[header].concat(rows).join('\n')],{type:'text/csv'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='koordinat_polisi_pekanbaru.csv';
  a.click();
  crudToast('CSV berhasil diexport!','success');
}

// ── TOAST ─────────────────────────────────────────
function crudToast(msg,type){
  type=type||'info';
  var icons={success:'✅',danger:'🗑',info:'📋'};
  var el=document.createElement('div');
  el.className='t-msg t-'+type;
  el.innerHTML=(icons[type]||'ℹ')+' '+msg;
  document.getElementById('toast-cont').appendChild(el);
  setTimeout(function(){el.remove();},3000);
}

// ── INIT ──────────────────────────────────────────
crudLoad();
crudRender();