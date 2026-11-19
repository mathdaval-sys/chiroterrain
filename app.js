/* ChiroTerrain — appli web de terrain (stations, arbres gîtes, observations chiro) */
'use strict';
const VERSION = '1.0.0';

/* ---------- Projections ---------- */
proj4.defs('EPSG:2154', '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
const toL93 = (lon, lat) => proj4('EPSG:4326', 'EPSG:2154', [lon, lat]);

/* ---------- Référentiels ---------- */
const TYPES = {
  station: { label: 'Station d\'enregistrement', court: 'Station', pre: 'S', cls: 'st', fichier: 'stations' },
  arbre:   { label: 'Arbre gîte potentiel', court: 'Arbre', pre: 'A', cls: 'ar', fichier: 'arbres_gites' },
  obs:     { label: 'Observation ponctuelle', court: 'Observation', pre: 'O', cls: 'ob', fichier: 'observations' },
};
const ESPECES = [
  ['Grand rhinolophe','Rhinolophus ferrumequinum'],['Petit rhinolophe','Rhinolophus hipposideros'],['Rhinolophe euryale','Rhinolophus euryale'],['Rhinolophe de Mehely','Rhinolophus mehelyi'],
  ['Grand murin','Myotis myotis'],['Petit murin','Myotis blythii'],['Murin de Bechstein','Myotis bechsteinii'],['Murin de Daubenton','Myotis daubentonii'],['Murin de Capaccini','Myotis capaccinii'],
  ['Murin des marais','Myotis dasycneme'],['Murin à oreilles échancrées','Myotis emarginatus'],['Murin de Natterer','Myotis nattereri'],['Murin cryptique','Myotis crypticus'],['Murin d\'Escalera','Myotis escalerai'],
  ['Murin à moustaches','Myotis mystacinus'],['Murin de Brandt','Myotis brandtii'],['Murin d\'Alcathoe','Myotis alcathoe'],['Noctule commune','Nyctalus noctula'],['Noctule de Leisler','Nyctalus leisleri'],
  ['Grande noctule','Nyctalus lasiopterus'],['Sérotine commune','Eptesicus serotinus'],['Sérotine de Nilsson','Eptesicus nilssonii'],['Sérotine bicolore','Vespertilio murinus'],['Pipistrelle commune','Pipistrellus pipistrellus'],
  ['Pipistrelle pygmée','Pipistrellus pygmaeus'],['Pipistrelle de Nathusius','Pipistrellus nathusii'],['Pipistrelle de Kuhl','Pipistrellus kuhlii'],['Vespère de Savi','Hypsugo savii'],['Barbastelle d\'Europe','Barbastella barbastellus'],
  ['Oreillard roux','Plecotus auritus'],['Oreillard gris','Plecotus austriacus'],['Oreillard montagnard','Plecotus macrobullaris'],['Minioptère de Schreibers','Miniopterus schreibersii'],['Molosse de Cestoni','Tadarida teniotis'],
  ['Murin indéterminé','Myotis sp.'],['Pipistrelle indéterminée','Pipistrellus sp.'],['Oreillard indéterminé','Plecotus sp.'],['Rhinolophe indéterminé','Rhinolophus sp.'],['Chiroptère indéterminé','Chiroptera sp.'],
].map(([v, s]) => `${v} (${s})`);
const ESSENCES = ['Chêne pédonculé','Chêne sessile','Chêne pubescent','Chêne vert','Hêtre','Châtaignier','Charme','Frêne','Érable','Platane','Peuplier','Saule','Aulne','Tilleul','Orme','Noyer','Merisier','Robinier','Pin','Sapin','Épicéa','Fruitier','Arbre mort'];
const MILIEUX = ['Lisière','Haie','Boisement feuillu','Boisement résineux','Boisement mixte','Allée / chemin forestier','Cours d\'eau / ripisylve','Plan d\'eau','Zone humide','Prairie','Friche','Culture','Vigne / verger','Bâti','Falaise / front de taille','Carrière','Autre'];

const FORMS = {
  station: [
    { k: 'code', l: 'Code station', t: 'text' },
    { k: 'detecteur', l: 'Détecteur', t: 'select', opts: () => settings.detecteurs },
    { k: 'num_serie', l: 'N° de série / identifiant de l\'appareil', t: 'text' },
    { k: 'date_pose', l: 'Date et heure de pose', t: 'datetime' },
    { k: 'date_releve', l: 'Date et heure de relève', t: 'datetime' },
    { k: 'hauteur_micro', l: 'Hauteur du micro (m)', t: 'number', step: '0.5' },
    { k: 'milieu', l: 'Milieu', t: 'select', opts: MILIEUX },
    { k: 'orientation', l: 'Orientation du micro', t: 'chips', opts: ['N','NE','E','SE','S','SO','O','NO','Vertical'] },
    { k: 'nb_nuits', l: 'Nuits prévues', t: 'number', step: '1' },
    { k: 'remarque', l: 'Remarque', t: 'textarea' },
  ],
  arbre: [
    { k: 'code', l: 'Code', t: 'text' },
    { k: 'essence', l: 'Essence', t: 'datalist', opts: ESSENCES },
    { k: 'diametre', l: 'Diamètre (cm)', t: 'number', step: '5' },
    { k: 'gites', l: 'Type(s) de gîte', t: 'multi', opts: ['Cavité de pic','Fissure / fente','Écorce décollée','Carie / pourriture','Branche cassée','Lierre dense','Trou de nœud','Autre'] },
    { k: 'nb_gites', l: 'Nombre de gîtes visibles', t: 'number', step: '1' },
    { k: 'hauteur_gite', l: 'Hauteur du gîte principal (m)', t: 'number', step: '0.5' },
    { k: 'potentialite', l: 'Potentialité', t: 'chips', opts: ['Faible','Modérée','Forte','Gîte avéré'] },
    { k: 'etat', l: 'État de l\'arbre', t: 'chips', opts: ['Vivant','Dépérissant','Mort sur pied'] },
    { k: 'marque', l: 'Arbre marqué sur le terrain', t: 'chips', opts: ['Oui','Non'] },
    { k: 'remarque', l: 'Remarque', t: 'textarea' },
  ],
  obs: [
    { k: 'code', l: 'Code', t: 'text' },
    { k: 'type_obs', l: 'Type', t: 'chips', opts: ['Bâti favorable','Grotte / cavité','Pont / ouvrage','Individu(s) observé(s)','Gîte avéré','Guano / indices','Cadavre','Autre'] },
    { k: 'espece', l: 'Espèce', t: 'datalist', opts: ESPECES },
    { k: 'effectif', l: 'Effectif', t: 'number', step: '1' },
    { k: 'potentialite', l: 'Potentialité', t: 'chips', opts: ['Faible','Modérée','Forte','Gîte avéré'] },
    { k: 'remarque', l: 'Remarque', t: 'textarea' },
  ],
};
// Valeurs reprises d'un point à l'autre pour aller vite
const MEMO = { station: ['detecteur', 'hauteur_micro', 'nb_nuits', 'milieu'], arbre: [], obs: [] };

/* ---------- Fonds de carte IGN (Géoplateforme, sans clé) ---------- */
const wmts = (layer, fmt, style = 'normal') => `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=${style}&TILEMATRIXSET=PM&FORMAT=${fmt}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
const FONDS = {
  ortho: { nom: 'Photo aérienne IGN', url: wmts('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'), natif: 19 },
  plan:  { nom: 'Plan IGN', url: wmts('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'), natif: 18 },
};
const CADASTRE = wmts('CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'image/png', 'PCI%20vecteur');
const TILE_CACHE = 'ct-tuiles';

/* ---------- Utilitaires ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowLocal = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fmtDate = s => s ? s.replace('T', ' ') : '';
const isoLocal = iso => { if (!iso) return ''; const d = new Date(iso); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' '); };
const stamp = () => nowLocal().replace(/[-:]/g, '').replace('T', '-');
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'site';
function dist(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const fmtDist = m => m == null ? '' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
let toastT;
function toast(msg, ms = 2500) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', ms); }

/* ---------- Base de données locale (IndexedDB) ---------- */
let DBH;
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('chiroterrain', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('sites', { keyPath: 'id' });
      d.createObjectStore('points', { keyPath: 'id' }).createIndex('siteId', 'siteId');
      d.createObjectStore('photos', { keyPath: 'id' }).createIndex('pointId', 'pointId');
      d.createObjectStore('settings', { keyPath: 'key' });
    };
    r.onsuccess = () => { DBH = r.result; res(); };
    r.onerror = () => rej(r.error);
  });
}
const store = (s, m = 'readonly') => DBH.transaction(s, m).objectStore(s);
const rq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbAll = s => rq(store(s).getAll());
const dbGet = (s, k) => rq(store(s).get(k));
const dbPut = (s, v) => rq(store(s, 'readwrite').put(v));
const dbDel = (s, k) => rq(store(s, 'readwrite').delete(k));
const photosOf = pid => rq(store('photos').index('pointId').getAll(pid));

/* ---------- État ---------- */
let sites = [], points = [];
let settings = {
  observateur: '', detecteurs: ['SM4BAT FS', 'SM Mini Bat', 'Batcorder', 'Audiomoth', 'Passive Recorder', 'Batlogger', 'Autre'],
  zoomMax: 18, fond: 'ortho', activeSiteId: null, last: { station: {}, arbre: {}, obs: {} },
};
let gps = null;
const saveSettings = () => dbPut('settings', { key: 'settings', value: settings });
const siteById = id => sites.find(s => s.id === id);
const activeSite = () => siteById(settings.activeSiteId);

/* ---------- Géométrie ---------- */
function inRing(x, y, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
const polysOf = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const inGeom = (lon, lat, g) => polysOf(g).some(p => inRing(lon, lat, p[0]) && !p.slice(1).some(h => inRing(lon, lat, h)));
function bboxOf(g) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  polysOf(g).forEach(p => p.forEach(r => r.forEach(([x, y]) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); })));
  return b;
}
const siteAt = (lat, lon) => sites.find(s => lon >= s.bbox[0] && lon <= s.bbox[2] && lat >= s.bbox[1] && lat <= s.bbox[3] && inGeom(lon, lat, s.geom));
const siteCenter = s => [(s.bbox[1] + s.bbox[3]) / 2, (s.bbox[0] + s.bbox[2]) / 2];
const siteDist = s => gps ? (inGeom(gps.lon, gps.lat, s.geom) ? 0 : dist(gps.lat, gps.lon, ...siteCenter(s))) : null;

/* ---------- Carte ---------- */
const map = L.map('map', { zoomControl: false, maxZoom: 20, attributionControl: true }).setView([46.6, 2.5], 6);
map.attributionControl.setPrefix(false);
const baseLayers = {};
for (const [k, f] of Object.entries(FONDS)) baseLayers[f.nom] = L.tileLayer(f.url, { maxZoom: 20, maxNativeZoom: f.natif, attribution: '© IGN' });
const cadastre = L.tileLayer(CADASTRE, { maxZoom: 20, maxNativeZoom: 19, minZoom: 13 });
L.control.layers(baseLayers, { 'Cadastre': cadastre }, { position: 'topright' }).addTo(map);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
map.on('baselayerchange', e => { settings.fond = Object.keys(FONDS).find(k => FONDS[k].nom === e.name) || 'ortho'; saveSettings(); });
const sitesLayer = L.layerGroup().addTo(map);
const pointsLayer = L.layerGroup().addTo(map);
const gpsLayer = L.layerGroup().addTo(map);
map.on('zoomend', () => map.getContainer().classList.toggle('hide-labels', map.getZoom() < 11));

function drawSites() {
  sitesLayer.clearLayers();
  for (const s of sites) {
    const act = s.id === settings.activeSiteId;
    L.geoJSON(s.geom, { interactive: false, style: { color: '#000', weight: act ? 7 : 5, opacity: .55, fill: false } }).addTo(sitesLayer);
    const g = L.geoJSON(s.geom, { interactive: false, style: { color: act ? '#ff3b30' : '#ffd400', weight: act ? 3.5 : 2.5, fillOpacity: act ? .06 : 0 } }).addTo(sitesLayer);
    g.bindTooltip(esc(s.nom), { permanent: true, direction: 'center', className: 'site-label' });
  }
}
function markerHtml(p, n = 0) {
  const code = esc(p.data.code || TYPES[p.type].pre);
  const off = p.type === 'station' && p.data.date_releve ? ' off' : '';
  const shift = n ? ` style="margin-left:${n * 16}px;margin-top:${n * 16}px"` : '';
  return `<div class="mk mk-${p.type}${off}"${shift}>${code}</div>`;
}
const markers = new Map();
function drawPoints() {
  pointsLayer.clearLayers(); markers.clear();
  const seen = new Map(); // décale les points superposés pour qu'ils restent cliquables
  for (const p of points) {
    const key = p.lat.toFixed(5) + ',' + p.lon.toFixed(5), n = seen.get(key) || 0; seen.set(key, n + 1);
    const m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'mkw', html: markerHtml(p, n), iconSize: null }) });
    m.on('click', () => showPoint(p.id));
    m.addTo(pointsLayer); markers.set(p.id, m);
  }
}
function refreshHeader() {
  const s = activeSite();
  $('#siteName').textContent = s ? s.nom : (sites.length ? 'Choisir un site' : 'Aucun site — importer');
}
function setActive(id, fit = true) {
  settings.activeSiteId = id; saveSettings(); refreshHeader(); drawSites();
  const s = activeSite();
  if (s && fit) map.fitBounds([[s.bbox[1], s.bbox[0]], [s.bbox[3], s.bbox[2]]], { padding: [30, 30] });
}

/* ---------- GPS ---------- */
let follow = false, gpsMk, gpsCircle;
function startGps() {
  if (!navigator.geolocation) { setChip('Pas de GPS', 'bad'); return; }
  navigator.geolocation.watchPosition(onPos, err => {
    setChip(err.code === 1 ? 'GPS refusé' : 'GPS…', 'bad');
    if (err.code === 1) toast('Autorisez la localisation pour cette appli dans Chrome.', 5000);
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
}
function setChip(txt, cls) { const c = $('#gpsChip'); c.textContent = txt; c.className = cls || ''; }
function onPos(pos) {
  const { latitude: lat, longitude: lon, accuracy: acc } = pos.coords;
  gps = { lat, lon, acc, ts: pos.timestamp };
  setChip(`GPS ±${Math.round(acc)} m`, acc <= 10 ? 'ok' : acc <= 30 ? 'warn' : 'bad');
  if (!gpsMk) {
    gpsCircle = L.circle([lat, lon], { radius: acc, color: '#2b7cff', weight: 1, fillOpacity: .12, interactive: false }).addTo(gpsLayer);
    gpsMk = L.marker([lat, lon], { icon: L.divIcon({ className: 'mkw', html: '<div class="gpsdot"></div>', iconSize: null }), interactive: false, zIndexOffset: 1000 }).addTo(gpsLayer);
  } else { gpsMk.setLatLng([lat, lon]); gpsCircle.setLatLng([lat, lon]).setRadius(acc); }
  if (follow) map.panTo([lat, lon]);
  checkGpsSite();
  document.dispatchEvent(new CustomEvent('gps'));
}
$('#btnFollow').onclick = () => {
  follow = !follow; $('#btnFollow').classList.toggle('on', follow);
  if (follow && gps) map.setView([gps.lat, gps.lon], Math.max(map.getZoom(), 17));
  else if (follow) toast('En attente du signal GPS…');
};
map.on('dragstart', () => { if (follow) { follow = false; $('#btnFollow').classList.remove('on'); } });
$('#btnFit').onclick = () => { const s = activeSite(); if (s) setActive(s.id); else openSites(); };

/* ---------- Feuilles (fenêtres du bas) ---------- */
let sheetLock = false;
function openSheet(html) {
  const sh = $('#sheet'), c = document.createElement('div'); c.innerHTML = html;
  sh.replaceChildren(c); sh.scrollTop = 0;
  sh.style.display = 'block'; $('#backdrop').style.display = 'block'; return c;
}
function closeSheet() { sheetLock = false; $('#sheet').style.display = 'none'; $('#backdrop').style.display = 'none'; $('#sheet').replaceChildren(); }
$('#backdrop').onclick = () => { if (!sheetLock) closeSheet(); };
function confirmSheet(msg, ok = 'Confirmer', danger = true) {
  return new Promise(res => {
    const sh = openSheet(`<h2>Confirmation</h2><p>${msg}</p><button class="btn ${danger ? 'dan' : 'pri'}" id="cOk">${esc(ok)}</button><button class="btn" id="cNo">Annuler</button>`);
    $('#cOk', sh).onclick = () => { closeSheet(); res(true); };
    $('#cNo', sh).onclick = () => { closeSheet(); res(false); };
  });
}

/* ---------- Viseur (placer / déplacer sur la carte) ---------- */
function pickOnMap(title, center) {
  return new Promise(res => {
    closeSheet();
    if (center) map.setView(center, Math.max(map.getZoom(), 18));
    $('#cross').style.display = 'block';
    const bar = $('#crossBar'); bar.style.display = 'block';
    bar.innerHTML = `<p><b>${esc(title)}</b><br><span class="mut">Déplacez la carte pour placer la croix rouge sur le point.</span></p>
      <div class="row"><button class="btn pri" id="xOk">Valider</button><button class="btn" id="xGps">Ma position</button><button class="btn" id="xNo">Annuler</button></div>`;
    const end = v => { $('#cross').style.display = 'none'; bar.style.display = 'none'; res(v); };
    $('#xOk').onclick = () => { const c = map.getCenter(); end({ lat: c.lat, lon: c.lng, acc: null, source: 'carte' }); };
    $('#xGps').onclick = () => { if (gps) map.setView([gps.lat, gps.lon], Math.max(map.getZoom(), 18)); else toast('Pas encore de position GPS'); };
    $('#xNo').onclick = () => end(null);
  });
}

/* ---------- Ajout d'un point ---------- */
$$('[data-add]').forEach(b => b.onclick = () => startAdd(b.dataset.add));
function startAdd(type) {
  const T = TYPES[type];
  const sh = openSheet(`<h2>${T.label}</h2><p class="mut">Où se trouve le point ?</p>
    <button class="btn ${T.cls}" id="aGps" disabled>Ma position GPS</button>
    <button class="btn" id="aAvg" disabled>Moyenner la position GPS (15 s)</button>
    <button class="btn" id="aMap">Viser sur la carte</button>
    <button class="btn" id="aNo">Annuler</button>`);
  const upd = () => {
    const ok = !!gps;
    $('#aGps', sh).disabled = !ok; $('#aAvg', sh).disabled = !ok;
    $('#aGps', sh).textContent = ok ? `Ma position GPS (±${Math.round(gps.acc)} m)` : 'Ma position GPS (en attente…)';
  };
  upd(); document.addEventListener('gps', upd);
  const done = () => document.removeEventListener('gps', upd);
  $('#aGps', sh).onclick = () => { done(); openForm(type, null, { lat: gps.lat, lon: gps.lon, acc: Math.round(gps.acc * 10) / 10, source: 'gps' }); };
  $('#aAvg', sh).onclick = async () => { done(); const loc = await averageGps(15); if (loc) openForm(type, null, loc); };
  $('#aMap', sh).onclick = async () => { done(); const loc = await pickOnMap(`Placer : ${T.court.toLowerCase()}`, gps ? [gps.lat, gps.lon] : null); if (loc) openForm(type, null, loc); };
  $('#aNo', sh).onclick = () => { done(); closeSheet(); };
}
function averageGps(sec) {
  return new Promise(res => {
    const pts = []; let left = sec, stop = false;
    const sh = openSheet(`<h2>Moyenne GPS</h2><p>Restez immobile près du point…</p><p id="avgTxt" class="mut"></p><div class="prog"><div id="avgBar"></div></div><button class="btn" id="avgEnd">Terminer maintenant</button>`);
    sheetLock = true;
    const add = () => { if (gps) pts.push({ ...gps }); };
    document.addEventListener('gps', add); add();
    const finish = () => {
      if (stop) return; stop = true; clearInterval(iv); document.removeEventListener('gps', add); sheetLock = false; closeSheet();
      if (!pts.length) { toast('Aucune position reçue'); return res(null); }
      let sw = 0, la = 0, lo = 0; pts.forEach(p => { const w = 1 / Math.max(p.acc, 1) ** 2; sw += w; la += p.lat * w; lo += p.lon * w; });
      const best = Math.min(...pts.map(p => p.acc));
      res({ lat: la / sw, lon: lo / sw, acc: Math.round(best * 10) / 10, source: `gps moyenné (${pts.length} pos.)` });
    };
    const iv = setInterval(() => {
      left--; $('#avgTxt', sh).textContent = `${pts.length} positions — encore ${left} s`;
      $('#avgBar', sh).style.width = `${100 * (sec - left) / sec}%`; if (left <= 0) finish();
    }, 1000);
    $('#avgEnd', sh).onclick = finish;
  });
}
function nextCode(type, siteId) {
  const pre = TYPES[type].pre; let max = 0;
  points.filter(p => p.type === type && p.siteId === siteId).forEach(p => { const m = String(p.data.code || '').match(new RegExp('^' + pre + '(\\d+)$')); if (m) max = Math.max(max, +m[1]); });
  return pre + String(max + 1).padStart(2, '0');
}

/* ---------- Formulaire ---------- */
function fieldHtml(f, v) {
  const id = 'f_' + f.k;
  const opts = typeof f.opts === 'function' ? f.opts() : f.opts;
  let h = `<label class="f" for="${id}">${esc(f.l)}</label>`;
  switch (f.t) {
    case 'text': return h + `<input id="${id}" name="${f.k}" value="${esc(v)}">`;
    case 'number': return h + `<input id="${id}" name="${f.k}" type="number" inputmode="decimal" step="${f.step || 'any'}" value="${esc(v)}">`;
    case 'textarea': return h + `<textarea id="${id}" name="${f.k}">${esc(v)}</textarea>`;
    case 'datetime': return h + `<div class="inl"><input id="${id}" name="${f.k}" type="datetime-local" value="${esc(v)}"><button type="button" class="btn sm" data-now="${id}">Maintenant</button><button type="button" class="btn sm" data-clear="${id}">×</button></div>`;
    case 'select': {
      const list = [...opts]; if (v && !list.includes(v)) list.push(v);
      return h + `<select id="${id}" name="${f.k}"><option value=""></option>${list.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    }
    case 'datalist': return h + `<input id="${id}" name="${f.k}" list="dl_${f.k}" value="${esc(v)}" autocomplete="off"><datalist id="dl_${f.k}">${opts.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
    case 'chips': case 'multi': {
      const sel = Array.isArray(v) ? v : (v ? [v] : []);
      return h + `<div class="chips" data-k="${f.k}" data-multi="${f.t === 'multi' ? 1 : 0}">${opts.map(o => `<button type="button" class="${sel.includes(o) ? 'on' : ''}">${esc(o)}</button>`).join('')}</div>`;
    }
  }
  return '';
}
function readForm(sh, type) {
  const d = {};
  for (const f of FORMS[type]) {
    if (f.t === 'chips' || f.t === 'multi') {
      const on = $$(`.chips[data-k="${f.k}"] button.on`, sh).map(b => b.textContent);
      d[f.k] = f.t === 'multi' ? on : (on[0] || '');
    } else {
      const el = $(`[name="${f.k}"]`, sh); let v = el ? el.value.trim() : '';
      if (f.t === 'number' && v !== '') v = Number(v.replace(',', '.'));
      d[f.k] = v;
    }
  }
  return d;
}
async function resizeImage(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82));
  } catch (e) { return file; }
}
async function openForm(type, point, loc) {
  const T = TYPES[type], isNew = !point;
  let siteId = point ? point.siteId : ((siteAt(loc.lat, loc.lon) || activeSite() || {}).id || null);
  const data = point ? { ...point.data } : {};
  if (isNew) {
    for (const k of MEMO[type]) if (settings.last[type][k] != null) data[k] = settings.last[type][k];
    data.code = nextCode(type, siteId);
    if (type === 'station') data.date_pose = nowLocal();
  }
  let autoCode = isNew ? data.code : null;
  const photos = point ? (await photosOf(point.id)).map(p => ({ ...p, url: URL.createObjectURL(p.blob) })) : [];
  const removed = [];
  const where = point || loc;
  const siteOpts = [...sites].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(s => `<option value="${s.id}"${s.id === siteId ? ' selected' : ''}>${esc(s.nom)}</option>`).join('');
  const sh = openSheet(`<h2><span class="badge bg-${T.cls}">${T.court}</span> ${isNew ? 'Nouveau point' : 'Modifier'}</h2>
    <p class="mut">${where.lat.toFixed(6)}, ${where.lon.toFixed(6)} — ${esc(where.source || '')}${where.acc ? ` ±${where.acc} m` : ''}</p>
    <label class="f" for="f_site">Site</label><select id="f_site"><option value="">Hors site</option>${siteOpts}</select>
    <form id="frm" onsubmit="return false">${FORMS[type].map(f => fieldHtml(f, data[f.k])).join('')}</form>
    <label class="f">Photos</label><div class="thumbs" id="thumbs"></div>
    <label class="btn" for="phIn">Ajouter une photo</label><input id="phIn" type="file" accept="image/*" capture="environment" multiple hidden>
    <button class="btn ${T.cls}" id="fSave">Enregistrer</button><button class="btn" id="fNo">Annuler</button>`);
  sheetLock = true;
  const drawThumbs = () => {
    $('#thumbs', sh).innerHTML = photos.map((p, i) => `<div><img src="${p.url}" data-i="${i}"><button class="x" data-del="${i}">×</button></div>`).join('');
  };
  drawThumbs();
  $('#thumbs', sh).onclick = e => {
    const del = e.target.dataset.del;
    if (del != null) { const [p] = photos.splice(+del, 1); if (!p.isNew) removed.push(p.id); drawThumbs(); }
    else if (e.target.dataset.i != null) viewPhoto(photos[+e.target.dataset.i].url);
  };
  $('#phIn', sh).onchange = async e => {
    for (const f of e.target.files) { const blob = await resizeImage(f); photos.push({ id: uuid(), blob, url: URL.createObjectURL(blob), isNew: true }); }
    e.target.value = ''; drawThumbs();
  };
  sh.addEventListener('click', e => {
    const b = e.target.closest('.chips button');
    if (b) { const c = b.parentElement; if (c.dataset.multi !== '1') { const was = b.classList.contains('on'); $$('button', c).forEach(x => x.classList.remove('on')); if (!was) b.classList.add('on'); } else b.classList.toggle('on'); }
    if (e.target.dataset.now) $('#' + e.target.dataset.now, sh).value = nowLocal();
    if (e.target.dataset.clear) $('#' + e.target.dataset.clear, sh).value = '';
  });
  $('#f_site', sh).onchange = e => {
    const c = $('[name="code"]', sh);
    if (autoCode && c.value === autoCode) { autoCode = nextCode(type, e.target.value || null); c.value = autoCode; }
  };
  $('#fNo', sh).onclick = () => { sheetLock = false; closeSheet(); };
  $('#fSave', sh).onclick = async () => {
    const d = readForm(sh, type);
    const p = point || { id: uuid(), type, lat: loc.lat, lon: loc.lon, acc: loc.acc, source: loc.source, createdAt: new Date().toISOString(), observateur: settings.observateur };
    p.siteId = $('#f_site', sh).value || null; p.data = d; p.updatedAt = new Date().toISOString();
    for (const id of removed) await dbDel('photos', id);
    for (const ph of photos.filter(x => x.isNew)) await dbPut('photos', { id: ph.id, pointId: p.id, blob: ph.blob, ts: Date.now() });
    p.nbPhotos = photos.length;
    await dbPut('points', p);
    if (isNew) points.push(p);
    for (const k of MEMO[type]) if (d[k] !== '' && d[k] != null) settings.last[type][k] = d[k];
    saveSettings(); askPersist();
    sheetLock = false; closeSheet(); drawPoints();
    toast(`${T.court} ${d.code || ''} enregistrée`);
  };
}
function viewPhoto(url) { const v = $('#photoView'); $('img', v).src = url; v.style.display = 'flex'; v.onclick = () => v.style.display = 'none'; }

/* ---------- Fiche d'un point ---------- */
async function showPoint(id) {
  const p = points.find(x => x.id === id); if (!p) return;
  const T = TYPES[p.type], s = siteById(p.siteId);
  const [x, y] = toL93(p.lon, p.lat);
  const rows = FORMS[p.type].filter(f => f.k !== 'code').map(f => {
    let v = p.data[f.k]; if (Array.isArray(v)) v = v.join(', '); if (f.t === 'datetime') v = fmtDate(v);
    return v === '' || v == null ? '' : `<tr><td>${esc(f.l)}</td><td>${esc(v)}</td></tr>`;
  }).join('');
  const ph = await photosOf(p.id);
  const d = gps ? dist(gps.lat, gps.lon, p.lat, p.lon) : null;
  const sh = openSheet(`<h2><span class="badge bg-${T.cls}">${T.court}</span> ${esc(p.data.code || '')}</h2>
    <p class="mut">${esc(s ? s.nom : 'Hors site')}${d != null ? ` — à ${fmtDist(d)}` : ''}</p>
    <table class="kv">${rows}
      <tr><td>Position</td><td>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}<br>L93 : ${Math.round(x)} / ${Math.round(y)}<br><span class="mut">${esc(p.source || '')}${p.acc ? ` ±${p.acc} m` : ''}</span></td></tr>
      <tr><td>Saisi</td><td>${esc(isoLocal(p.createdAt))} ${esc(p.observateur || '')}</td></tr></table>
    <div class="thumbs" id="pThumbs">${ph.map((f, i) => `<div><img data-i="${i}" src="${URL.createObjectURL(f.blob)}"></div>`).join('')}</div>
    ${p.type === 'station' && !p.data.date_releve ? `<button class="btn st" id="pRel">Relever maintenant</button>` : ''}
    <div class="row"><button class="btn pri" id="pEdit">Modifier</button><button class="btn" id="pMove">Déplacer</button></div>
    <div class="row"><a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">Itinéraire</a><button class="btn dan" id="pDel">Supprimer</button></div>
    <button class="btn" id="pClose">Fermer</button>`);
  $('#pThumbs', sh).onclick = e => { if (e.target.dataset.i != null) viewPhoto(e.target.src); };
  $('#pClose', sh).onclick = closeSheet;
  $('#pEdit', sh).onclick = () => openForm(p.type, p);
  if ($('#pRel', sh)) $('#pRel', sh).onclick = async () => { p.data.date_releve = nowLocal(); p.updatedAt = new Date().toISOString(); await dbPut('points', p); drawPoints(); closeSheet(); toast(`Station ${p.data.code} relevée`); };
  $('#pMove', sh).onclick = async () => {
    const loc = await pickOnMap(`Déplacer ${p.data.code || ''}`, [p.lat, p.lon]);
    if (!loc) return;
    Object.assign(p, { lat: loc.lat, lon: loc.lon, acc: loc.acc, source: 'carte (déplacé)', updatedAt: new Date().toISOString() });
    await dbPut('points', p); drawPoints(); toast('Point déplacé');
  };
  $('#pDel', sh).onclick = async () => {
    if (!await confirmSheet(`Supprimer ${esc(T.court.toLowerCase())} ${esc(p.data.code || '')} et ses photos ?`, 'Supprimer')) return;
    for (const f of await photosOf(p.id)) await dbDel('photos', f.id);
    await dbDel('points', p.id); points = points.filter(x => x.id !== p.id); drawPoints(); toast('Point supprimé');
  };
}

/* ---------- Liste des sites ---------- */
function openSites() {
  const list = [...sites].map(s => ({ s, d: siteDist(s) })).sort((a, b) => (a.d ?? 1e12) - (b.d ?? 1e12) || a.s.nom.localeCompare(b.s.nom, 'fr'));
  const cnt = (id, t) => points.filter(p => p.siteId === id && p.type === t).length;
  const sh = openSheet(`<h2>Sites d'étude (${sites.length})</h2>
    ${sites.length > 6 ? '<input id="sSearch" placeholder="Rechercher un site…">' : ''}
    <ul class="list" id="sList">${list.map(({ s, d }) => `<li data-id="${s.id}" class="${s.id === settings.activeSiteId ? 'act' : ''}">
      <div class="t" data-go="${s.id}"><b>${esc(s.nom)}</b><small>${esc(s.annee || '')}${d != null ? ' · ' + (d === 0 ? 'vous y êtes' : fmtDist(d)) : ''}
      · <span class="badge bg-st">${cnt(s.id, 'station')}</span><span class="badge bg-ar">${cnt(s.id, 'arbre')}</span><span class="badge bg-ob">${cnt(s.id, 'obs')}</span>
      ${s.offline ? ' · fond hors ligne ✓' : ''}</small></div>
      <button class="btn sm" data-more="${s.id}">…</button></li>`).join('')}</ul>
    ${sites.length ? '' : '<p class="mut">Aucun site. Importez vos périmètres (GeoJSON ou KML exporté de QGIS).</p>'}
    <button class="btn pri" id="sImp">Importer des périmètres</button>
    ${sites.length ? '<button class="btn" id="sAllOff">Télécharger le fond hors ligne de tous les sites</button>' : ''}
    <button class="btn" id="sClose">Fermer</button>`);
  if ($('#sSearch', sh)) $('#sSearch', sh).oninput = e => { const q = e.target.value.toLowerCase(); $$('#sList li', sh).forEach(li => li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  $('#sList', sh).onclick = e => {
    const go = e.target.closest('[data-go]'); const more = e.target.closest('[data-more]');
    if (go) { closeSheet(); setActive(go.dataset.go); }
    if (more) siteMenu(siteById(more.dataset.more));
  };
  $('#sImp', sh).onclick = pickImport;
  if ($('#sAllOff', sh)) $('#sAllOff', sh).onclick = () => downloadTiles(sites);
  $('#sClose', sh).onclick = closeSheet;
}
$('#btnSite').onclick = openSites;
function siteMenu(s) {
  const n = points.filter(p => p.siteId === s.id).length;
  const sh = openSheet(`<h2>${esc(s.nom)}</h2><p class="mut">${n} point(s)${s.offline ? ` · fond hors ligne téléchargé le ${esc(s.offline.date)} (${s.offline.n} tuiles)` : ''}</p>
    <button class="btn pri" id="mAct">Voir et activer ce site</button>
    <button class="btn" id="mOff">${s.offline ? 'Mettre à jour' : 'Télécharger'} le fond hors ligne</button>
    <button class="btn" id="mExp">Exporter les points de ce site (QGIS)</button>
    <button class="btn" id="mCT">Envoyer les stations vers ChiroThèque</button>
    <button class="btn" id="mRen">Renommer</button>
    <button class="btn dan" id="mDel">Supprimer le site</button>
    <button class="btn" id="mBack">Retour</button>`);
  $('#mAct', sh).onclick = () => { closeSheet(); setActive(s.id); };
  $('#mOff', sh).onclick = () => downloadTiles([s]);
  $('#mExp', sh).onclick = () => exportZip([s.id]);
  $('#mCT', sh).onclick = () => exportChirotheque([s.id]);
  $('#mBack', sh).onclick = openSites;
  $('#mRen', sh).onclick = () => {
    const sh2 = openSheet(`<h2>Renommer</h2><input id="rn" value="${esc(s.nom)}"><label class="f">Année</label><input id="ra" value="${esc(s.annee || '')}"><button class="btn pri" id="rOk">Enregistrer</button><button class="btn" id="rNo">Annuler</button>`);
    $('#rOk', sh2).onclick = async () => { s.nom = $('#rn', sh2).value.trim() || s.nom; s.annee = $('#ra', sh2).value.trim(); await dbPut('sites', s); drawSites(); refreshHeader(); siteMenu(s); };
    $('#rNo', sh2).onclick = () => siteMenu(s);
  };
  $('#mDel', sh).onclick = () => {
    const sh2 = openSheet(`<h2>Supprimer « ${esc(s.nom)} »</h2>
      ${n ? `<p>Ce site contient <b>${n} point(s)</b>. Pensez à exporter avant.</p><button class="btn dan" id="dAll">Supprimer le site et ses ${n} points</button><button class="btn" id="dPer">Supprimer seulement le périmètre (points gardés « hors site »)</button>` : `<button class="btn dan" id="dPer">Supprimer</button>`}
      <button class="btn" id="dNo">Annuler</button>`);
    const del = async withPts => {
      for (const p of points.filter(p => p.siteId === s.id)) {
        if (withPts) { for (const f of await photosOf(p.id)) await dbDel('photos', f.id); await dbDel('points', p.id); }
        else { p.siteId = null; await dbPut('points', p); }
      }
      if (withPts) points = points.filter(p => p.siteId !== s.id);
      await dbDel('sites', s.id); sites = sites.filter(x => x.id !== s.id);
      if (settings.activeSiteId === s.id) settings.activeSiteId = null;
      saveSettings(); drawSites(); drawPoints(); refreshHeader(); openSites();
    };
    if ($('#dAll', sh2)) $('#dAll', sh2).onclick = () => del(true);
    $('#dPer', sh2).onclick = () => del(false);
    $('#dNo', sh2).onclick = () => siteMenu(s);
  };
}

/* ---------- Import des périmètres ---------- */
function pickImport() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.geojson,.json,.kml,application/json,application/geo+json,application/vnd.google-earth.kml+xml';
  inp.onchange = () => inp.files[0] && importFile(inp.files[0]);
  inp.click();
}
function kmlToFeatures(txt) {
  const doc = new DOMParser().parseFromString(txt, 'text/xml');
  const ring = el => el.textContent.trim().split(/\s+/).map(t => t.split(',').map(Number)).filter(c => c.length >= 2 && !isNaN(c[0])).map(c => [c[0], c[1]]);
  return [...doc.getElementsByTagName('Placemark')].map(pm => {
    const props = { name: (pm.getElementsByTagName('name')[0] || {}).textContent || '' };
    [...pm.getElementsByTagName('Data')].forEach(d => props[d.getAttribute('name')] = (d.getElementsByTagName('value')[0] || {}).textContent);
    [...pm.getElementsByTagName('SimpleData')].forEach(d => props[d.getAttribute('name')] = d.textContent);
    const polys = [...pm.getElementsByTagName('Polygon')].map(pg => {
      const outer = pg.getElementsByTagName('outerBoundaryIs')[0], inners = [...pg.getElementsByTagName('innerBoundaryIs')];
      return [ring(outer.getElementsByTagName('coordinates')[0]), ...inners.map(i => ring(i.getElementsByTagName('coordinates')[0]))];
    });
    if (!polys.length) return null;
    return { type: 'Feature', properties: props, geometry: polys.length === 1 ? { type: 'Polygon', coordinates: polys[0] } : { type: 'MultiPolygon', coordinates: polys } };
  }).filter(Boolean);
}
function detectCrs(gj, feats) {
  const name = gj.crs && gj.crs.properties && gj.crs.properties.name || '';
  const m = name.match(/(\d{4,6})\s*$/);
  if (m && m[1] !== '4326') return 'EPSG:' + m[1];
  if (/CRS84/i.test(name)) return null;
  const c = polysOf(feats[0].geometry)[0][0][0];
  if (Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) return c[0] > 1e5 && c[0] < 1.3e6 && c[1] > 6e6 && c[1] < 7.2e6 ? 'EPSG:2154' : 'EPSG:3857';
  return null;
}
function reproject(g, crs) {
  const f = c => proj4(crs, 'EPSG:4326', [c[0], c[1]]);
  const P = poly => poly.map(r => r.map(f));
  return g.type === 'Polygon' ? { type: 'Polygon', coordinates: P(g.coordinates) } : { type: 'MultiPolygon', coordinates: g.coordinates.map(P) };
}
async function importFile(file) {
  let feats, gj = {};
  try {
    const txt = await file.text();
    if (/\.kml$/i.test(file.name) || txt.trim().startsWith('<')) feats = kmlToFeatures(txt);
    else {
      gj = JSON.parse(txt);
      feats = gj.type === 'FeatureCollection' ? gj.features : gj.type === 'Feature' ? [gj] : [{ type: 'Feature', properties: {}, geometry: gj }];
    }
  } catch (e) { toast('Fichier illisible : ' + e.message, 5000); return; }
  feats = (feats || []).filter(f => f && f.geometry && /^(Multi)?Polygon$/.test(f.geometry.type));
  if (!feats.length) { toast('Aucun polygone trouvé dans ce fichier', 5000); return; }
  const crs = detectCrs(gj, feats);
  if (crs) {
    if (!proj4.defs(crs)) { toast(`Système ${crs} non géré : réexportez en WGS84 ou Lambert-93`, 6000); return; }
    feats = feats.map(f => ({ ...f, geometry: reproject(f.geometry, crs) }));
  }
  const keys = [...new Set(feats.flatMap(f => Object.keys(f.properties || {})))];
  const guess = keys.find(k => /^(nom_?site|site|nom|name|libelle|intitule)$/i.test(k)) || keys.find(k => /nom|name|site/i.test(k)) || keys[0] || '';
  const sh = openSheet(`<h2>Importer ${feats.length} polygone(s)</h2>
    <p class="mut">${esc(file.name)}${crs ? ` — converti depuis ${crs}` : ' — WGS84'}</p>
    <label class="f">Champ contenant le nom du site</label>
    <select id="iKey">${keys.map(k => `<option${k === guess ? ' selected' : ''}>${esc(k)}</option>`).join('')}<option value="">(numéroter automatiquement)</option></select>
    <label class="f">Année / campagne</label><input id="iYear" value="${new Date().getFullYear()}">
    <label class="f"><input type="checkbox" id="iMerge" checked style="width:auto"> Fusionner les polygones portant le même nom</label>
    <label class="f"><input type="checkbox" id="iRepl" checked style="width:auto"> Remplacer les sites existants de même nom</label>
    <p class="mut" id="iPrev"></p>
    <button class="btn pri" id="iOk">Importer</button><button class="btn" id="iNo">Annuler</button>`);
  const names = () => { const k = $('#iKey', sh).value; return feats.map((f, i) => String((k && f.properties && f.properties[k]) ?? '').trim() || `Site ${i + 1}`); };
  const prev = () => { const n = [...new Set(names())]; $('#iPrev', sh).textContent = `${n.length} site(s) : ${n.slice(0, 8).join(', ')}${n.length > 8 ? '…' : ''}`; };
  prev(); $('#iKey', sh).onchange = prev;
  $('#iNo', sh).onclick = closeSheet;
  $('#iOk', sh).onclick = async () => {
    const nm = names(), year = $('#iYear', sh).value.trim(), merge = $('#iMerge', sh).checked, repl = $('#iRepl', sh).checked;
    const groups = new Map();
    feats.forEach((f, i) => {
      const key = merge ? nm[i] : nm[i] + '\u0000' + i;
      if (!groups.has(key)) groups.set(key, { nom: nm[i], polys: [], props: f.properties || {} });
      groups.get(key).polys.push(...polysOf(f.geometry));
    });
    let nNew = 0, nRep = 0;
    for (const g of groups.values()) {
      const geom = g.polys.length === 1 ? { type: 'Polygon', coordinates: g.polys[0] } : { type: 'MultiPolygon', coordinates: g.polys };
      const old = repl && sites.find(s => s.nom === g.nom);
      const s = old || { id: uuid(), createdAt: new Date().toISOString() };
      Object.assign(s, { nom: g.nom, annee: year, geom, bbox: bboxOf(geom), props: g.props });
      if (old) { s.offline = null; nRep++; } else { sites.push(s); nNew++; }
      await dbPut('sites', s);
    }
    closeSheet(); drawSites(); refreshHeader(); checkGpsSite(); askPersist();
    const all = sites.reduce((b, s) => [Math.min(b[0], s.bbox[0]), Math.min(b[1], s.bbox[1]), Math.max(b[2], s.bbox[2]), Math.max(b[3], s.bbox[3])], [180, 90, -180, -90]);
    map.fitBounds([[all[1], all[0]], [all[3], all[2]]], { padding: [30, 30] });
    toast(`${nNew} site(s) ajouté(s)${nRep ? `, ${nRep} remplacé(s)` : ''}`, 4000);
  };
}

/* ---------- Fonds hors ligne ---------- */
const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z); };
function tileUrls(s) {
  const buf = 300, lat = (s.bbox[1] + s.bbox[3]) / 2;
  const dLat = buf / 111320, dLon = buf / (111320 * Math.cos(lat * Math.PI / 180));
  const b = [s.bbox[0] - dLon, s.bbox[1] - dLat, s.bbox[2] + dLon, s.bbox[3] + dLat];
  const out = [];
  const add = (tpl, z0, z1) => {
    for (let z = z0; z <= z1; z++) for (let x = lon2x(b[0], z); x <= lon2x(b[2], z); x++) for (let y = lat2y(b[3], z); y <= lat2y(b[1], z); y++)
      out.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y));
  };
  add(FONDS.ortho.url, 12, Math.min(settings.zoomMax, 19));
  add(FONDS.plan.url, 12, 16);
  return out;
}
async function fetchTile(cache, url) {
  if (await cache.match(url)) return 'ok';
  try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) { await cache.put(url, r); return 'ok'; } return 'err'; }
  catch (e) {
    try { const r = await fetch(url, { mode: 'no-cors' }); await cache.put(url, r); return 'ok'; } catch (e2) { return 'err'; }
  }
}
async function downloadTiles(list) {
  if (!('caches' in window)) { toast('Cache non disponible dans ce navigateur'); return; }
  const jobs = list.map(s => ({ s, urls: tileUrls(s) }));
  const total = jobs.reduce((n, j) => n + j.urls.length, 0);
  if (total > 20000 && !await confirmSheet(`${total} tuiles à télécharger (environ ${Math.round(total * 0.025)} Mo). Continuer ?`, 'Télécharger', false)) return;
  let done = 0, err = 0, cancel = false;
  const sh = openSheet(`<h2>Fond hors ligne</h2><p id="dTxt"></p><div class="prog"><div id="dBar"></div></div><p class="mut">Restez connecté (Wi-Fi conseillé) et gardez l'appli ouverte.</p><button class="btn" id="dStop">Arrêter</button>`);
  sheetLock = true;
  $('#dStop', sh).onclick = () => { cancel = true; };
  const cache = await caches.open(TILE_CACHE);
  for (const j of jobs) {
    let jerr = 0; const q = [...j.urls];
    const worker = async () => { while (q.length && !cancel) { const r = await fetchTile(cache, q.shift()); done++; if (r !== 'ok') { err++; jerr++; } if (done % 10 === 0 || done === total) { $('#dTxt', sh).textContent = `${j.s.nom} — ${done} / ${total} tuiles${err ? ` (${err} erreurs)` : ''}`; $('#dBar', sh).style.width = `${100 * done / total}%`; } } };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (cancel) break;
    j.s.offline = { date: nowLocal().slice(0, 10), n: j.urls.length - jerr }; await dbPut('sites', j.s);
  }
  sheetLock = false; closeSheet(); askPersist();
  toast(cancel ? 'Téléchargement arrêté' : `Fond hors ligne prêt${err ? ` (${err} tuiles en erreur — relancer plus tard)` : ''}`, 5000);
}

/* ---------- Exports ---------- */
const flat = v => Array.isArray(v) ? v.join(', ') : v ?? '';
async function photoNames(p) {
  const s = siteById(p.siteId), ph = await photosOf(p.id);
  return ph.map((f, i) => ({ f, name: `${slug(s ? s.nom : 'hors_site')}_${slug(p.data.code || p.type)}_${i + 1}.jpg` }));
}
function propsOf(p, names) {
  const s = siteById(p.siteId); const [x, y] = toL93(p.lon, p.lat);
  const o = { site: s ? s.nom : '', annee: s ? s.annee : '' };
  for (const f of FORMS[p.type]) o[f.k] = f.t === 'datetime' ? fmtDate(p.data[f.k]) : flat(p.data[f.k]);
  Object.assign(o, { observateur: p.observateur || '', x_l93: Math.round(x * 100) / 100, y_l93: Math.round(y * 100) / 100, lat: +p.lat.toFixed(7), lon: +p.lon.toFixed(7), precision_m: p.acc ?? '', source_pos: p.source || '', saisi_le: isoLocal(p.createdAt), modifie_le: isoLocal(p.updatedAt), photos: names.join(' | '), id: p.id });
  return o;
}
function csvOf(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const cell = v => { v = String(v ?? ''); return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return '﻿' + [keys.join(';'), ...rows.map(r => keys.map(k => cell(r[k])).join(';'))].join('\r\n');
}
function stationsCT(pts) {
  return {
    format: 'chiroterrain-stations', version: 1, exporte_le: new Date().toISOString(), appli: 'ChiroTerrain ' + VERSION, systeme: 'WGS84 (EPSG:4326) + Lambert-93 (EPSG:2154)',
    stations: pts.filter(p => p.type === 'station').map(p => {
      const s = siteById(p.siteId); const [x, y] = toL93(p.lon, p.lat);
      return { id: p.id, code: p.data.code || '', site: s ? s.nom : '', annee: s ? s.annee : '', lat: +p.lat.toFixed(7), lon: +p.lon.toFixed(7), x_l93: Math.round(x * 100) / 100, y_l93: Math.round(y * 100) / 100,
        precision_m: p.acc ?? null, detecteur: p.data.detecteur || '', num_serie: p.data.num_serie || '', date_pose: fmtDate(p.data.date_pose) || null, date_releve: fmtDate(p.data.date_releve) || null,
        hauteur_micro_m: p.data.hauteur_micro === '' ? null : p.data.hauteur_micro ?? null, milieu: p.data.milieu || '', orientation: p.data.orientation || '', nb_nuits: p.data.nb_nuits === '' ? null : p.data.nb_nuits ?? null, remarque: p.data.remarque || '', observateur: p.observateur || '' };
    }),
  };
}
const ptsFor = siteIds => siteIds ? points.filter(p => siteIds.includes(p.siteId)) : points;
const scopeName = siteIds => siteIds && siteIds.length === 1 ? slug((siteById(siteIds[0]) || {}).nom) : 'tous_sites';
async function exportZip(siteIds) {
  const pts = ptsFor(siteIds);
  if (!pts.length) { toast('Aucun point à exporter'); return; }
  toast('Préparation de l\'export…');
  const zip = new JSZip();
  for (const [type, T] of Object.entries(TYPES)) {
    const list = pts.filter(p => p.type === type); if (!list.length) continue;
    const feats = [], rows = [];
    for (const p of list) {
      const ph = await photoNames(p);
      ph.forEach(({ f, name }) => zip.file('photos/' + name, f.blob));
      const pr = propsOf(p, ph.map(x => x.name));
      rows.push(pr); feats.push({ type: 'Feature', properties: pr, geometry: { type: 'Point', coordinates: [+p.lon.toFixed(7), +p.lat.toFixed(7)] } });
    }
    zip.file(`${T.fichier}.geojson`, JSON.stringify({ type: 'FeatureCollection', name: T.fichier, crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }, features: feats }, null, 1));
    zip.file(`${T.fichier}_L93.csv`, csvOf(rows));
  }
  if (pts.some(p => p.type === 'station')) zip.file('stations.chirotheque.json', JSON.stringify(stationsCT(pts), null, 2));
  zip.file('LISEZMOI.txt', `Export ChiroTerrain ${VERSION} du ${new Date().toLocaleString('fr-FR')}\r\n\r\n` +
    `*.geojson : couches de points en WGS84 — glisser dans QGIS. Attributs x_l93 / y_l93 en Lambert-93.\r\n` +
    `*_L93.csv : mêmes données, séparateur « ; ». Dans QGIS : Couche > Ajouter une couche de texte délimité, X = x_l93, Y = y_l93, SCR = EPSG:2154.\r\n` +
    `stations.chirotheque.json : stations au format d'échange ChiroThèque.\r\n` +
    `photos/ : photos nommées site_code_n.jpg (listées dans l'attribut « photos »).\r\n`);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  deliver(blob, `ChiroTerrain_${scopeName(siteIds)}_${stamp()}.zip`, 'application/zip');
}
function exportChirotheque(siteIds) {
  const pts = ptsFor(siteIds).filter(p => p.type === 'station');
  if (!pts.length) { toast('Aucune station à envoyer'); return; }
  const blob = new Blob([JSON.stringify(stationsCT(pts), null, 2)], { type: 'application/json' });
  deliver(blob, `stations_${scopeName(siteIds)}_${stamp()}.chirotheque.json`, 'application/json', `${pts.length} station(s). Partagez le fichier par Bluetooth vers le PC, ou branchez le téléphone en USB : il se trouve dans le dossier Téléchargements.`);
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
function deliver(blob, name, mime, note = '') {
  const file = new File([blob], name, { type: mime });
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  const sh = openSheet(`<h2>Fichier prêt</h2><p><b>${esc(name)}</b><br><span class="mut">${(blob.size / 1024 / 1024).toFixed(2)} Mo</span></p>${note ? `<p class="mut">${esc(note)}</p>` : ''}
    ${canShare ? '<button class="btn pri" id="eShare">Partager (Bluetooth, e-mail, Drive…)</button>' : ''}
    <button class="btn ${canShare ? '' : 'pri'}" id="eDl">Enregistrer dans Téléchargements</button>
    <button class="btn" id="eNo">Fermer</button>`);
  if (canShare) $('#eShare', sh).onclick = async () => { try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e.name !== 'AbortError') toast('Partage impossible : ' + e.message); } };
  $('#eDl', sh).onclick = () => { downloadBlob(blob, name); toast('Fichier enregistré dans Téléchargements'); };
  $('#eNo', sh).onclick = closeSheet;
}

/* ---------- Sauvegarde complète / restauration ---------- */
const b64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
async function backup() {
  toast('Préparation de la sauvegarde…');
  const ph = await dbAll('photos');
  const data = { format: 'chiroterrain-sauvegarde', version: 1, date: new Date().toISOString(), sites, points, settings, photos: await Promise.all(ph.map(async p => ({ id: p.id, pointId: p.pointId, ts: p.ts, data: await b64(p.blob) }))) };
  deliver(new Blob([JSON.stringify(data)], { type: 'application/json' }), `ChiroTerrain_sauvegarde_${stamp()}.json`, 'application/json', 'Contient tous les sites, points et photos. Sert à changer de téléphone ou à archiver la saison.');
}
function restore() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text());
      if (d.format !== 'chiroterrain-sauvegarde') throw new Error('ce n\'est pas une sauvegarde ChiroTerrain');
      if (!await confirmSheet(`Restaurer ${d.sites.length} site(s), ${d.points.length} point(s) et ${d.photos.length} photo(s) ? Les éléments existants avec le même identifiant seront remplacés, les autres conservés.`, 'Restaurer', false)) return;
      for (const s of d.sites) await dbPut('sites', s);
      for (const p of d.points) await dbPut('points', p);
      for (const p of d.photos) await dbPut('photos', { id: p.id, pointId: p.pointId, ts: p.ts, blob: await (await fetch(p.data)).blob() });
      await loadAll(); toast('Restauration terminée');
    } catch (e) { toast('Restauration impossible : ' + e.message, 5000); }
  };
  inp.click();
}

/* ---------- Stations à relever ---------- */
function openPending() {
  const list = points.filter(p => p.type === 'station' && !p.data.date_releve).map(p => ({ p, d: gps ? dist(gps.lat, gps.lon, p.lat, p.lon) : null })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
  const sh = openSheet(`<h2>Stations à relever (${list.length})</h2>
    <ul class="list" id="pList">${list.map(({ p, d }) => `<li><div class="t" data-go="${p.id}"><b>${esc(p.data.code)} — ${esc((siteById(p.siteId) || {}).nom || 'Hors site')}</b><small>posée ${esc(fmtDate(p.data.date_pose))}${d != null ? ' · ' + fmtDist(d) : ''}</small></div><button class="btn sm st" data-rel="${p.id}">Relever</button></li>`).join('')}</ul>
    ${list.length ? '' : '<p class="mut">Toutes les stations sont relevées.</p>'}<button class="btn" id="pcClose">Fermer</button>`);
  $('#pList', sh).onclick = async e => {
    const go = e.target.closest('[data-go]'), rel = e.target.closest('[data-rel]');
    if (go) { const p = points.find(x => x.id === go.dataset.go); closeSheet(); map.setView([p.lat, p.lon], 18); showPoint(p.id); }
    if (rel) { const p = points.find(x => x.id === rel.dataset.rel); p.data.date_releve = nowLocal(); p.updatedAt = new Date().toISOString(); await dbPut('points', p); drawPoints(); toast(`Station ${p.data.code} relevée`); openPending(); }
  };
  $('#pcClose', sh).onclick = closeSheet;
}

/* ---------- Menu & réglages ---------- */
$('#btnMenu').onclick = () => {
  const s = activeSite();
  const sh = openSheet(`<h2>ChiroTerrain</h2>
    <button class="btn" id="mSites">Sites d'étude</button>
    <button class="btn" id="mImp">Importer des périmètres</button>
    <button class="btn" id="mPend">Stations à relever</button>
    <h3>Exporter</h3>
    ${s ? `<button class="btn" id="mExpS">Points du site « ${esc(s.nom)} » (QGIS)</button>` : ''}
    <button class="btn" id="mExpA">Tous les points (QGIS)</button>
    <button class="btn" id="mCT">Envoyer les stations vers ChiroThèque</button>
    <h3>Données</h3>
    <button class="btn" id="mBak">Sauvegarde complète (avec photos)</button>
    <button class="btn" id="mRes">Restaurer une sauvegarde</button>
    <button class="btn" id="mSet">Réglages</button>
    <button class="btn" id="mClose">Fermer</button>
    <p class="mut" style="text-align:center">Version ${VERSION} — données stockées uniquement sur ce téléphone</p>`);
  $('#mSites', sh).onclick = openSites; $('#mImp', sh).onclick = pickImport; $('#mPend', sh).onclick = openPending;
  if (s) $('#mExpS', sh).onclick = () => exportZip([s.id]);
  $('#mExpA', sh).onclick = () => exportZip(null);
  $('#mCT', sh).onclick = () => {
    const sh2 = openSheet(`<h2>Envoyer vers ChiroThèque</h2>${s ? `<button class="btn pri" id="c1">Stations du site « ${esc(s.nom)} »</button>` : ''}<button class="btn" id="c2">Toutes les stations</button><button class="btn" id="c3">Annuler</button>`);
    if (s) $('#c1', sh2).onclick = () => exportChirotheque([s.id]);
    $('#c2', sh2).onclick = () => exportChirotheque(null); $('#c3', sh2).onclick = closeSheet;
  };
  $('#mBak', sh).onclick = backup; $('#mRes', sh).onclick = restore; $('#mSet', sh).onclick = openSettings; $('#mClose', sh).onclick = closeSheet;
};
async function openSettings() {
  let usage = '';
  try { const e = await navigator.storage.estimate(); usage = `${(e.usage / 1048576).toFixed(0)} Mo utilisés`; } catch (e) { }
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false;
  const sh = openSheet(`<h2>Réglages</h2>
    <label class="f">Observateur (initiales ou nom)</label><input id="sObs" value="${esc(settings.observateur)}">
    <label class="f">Détecteurs (un par ligne)</label><textarea id="sDet" rows="6">${esc(settings.detecteurs.join('\n'))}</textarea>
    <label class="f">Zoom maximal du fond hors ligne</label>
    <select id="sZoom">${[17, 18, 19].map(z => `<option value="${z}"${z === settings.zoomMax ? ' selected' : ''}>${z}${z === 18 ? ' (conseillé)' : z === 19 ? ' (très détaillé, 4× plus lourd)' : ' (léger)'}</option>`).join('')}</select>
    <p class="mut">${usage}${persisted ? ' · stockage protégé' : ' · stockage non protégé (Chrome peut l\'effacer si le téléphone manque de place)'}</p>
    <button class="btn pri" id="sOk">Enregistrer</button>
    <button class="btn" id="sTiles">Vider le cache des fonds de carte</button>
    <button class="btn dan" id="sWipe">Tout effacer (sites, points, photos)</button>
    <button class="btn" id="sNo">Fermer</button>`);
  $('#sOk', sh).onclick = () => {
    settings.observateur = $('#sObs', sh).value.trim();
    settings.detecteurs = $('#sDet', sh).value.split('\n').map(s => s.trim()).filter(Boolean);
    settings.zoomMax = +$('#sZoom', sh).value; saveSettings(); closeSheet(); toast('Réglages enregistrés');
  };
  $('#sTiles', sh).onclick = async () => {
    if (!await confirmSheet('Vider le cache des fonds de carte ? Il faudra les retélécharger pour travailler hors ligne.', 'Vider')) return;
    await caches.delete(TILE_CACHE); for (const s of sites) { s.offline = null; await dbPut('sites', s); } toast('Cache vidé');
  };
  $('#sWipe', sh).onclick = async () => {
    if (!await confirmSheet('Effacer TOUS les sites, points et photos de ce téléphone ? Faites une sauvegarde complète avant.', 'Tout effacer')) return;
    for (const st of ['sites', 'points', 'photos']) await rq(store(st, 'readwrite').clear());
    settings.activeSiteId = null; saveSettings(); await loadAll(); toast('Données effacées');
  };
  $('#sNo', sh).onclick = closeSheet;
}
let persistAsked = false;
async function askPersist() { if (persistAsked || !navigator.storage || !navigator.storage.persist) return; persistAsked = true; try { await navigator.storage.persist(); } catch (e) { } }

/* ---------- Démarrage ---------- */
async function loadAll() {
  sites = await dbAll('sites'); points = await dbAll('points');
  drawSites(); drawPoints(); refreshHeader(); checkGpsSite();
}
function checkGpsSite() {
  if (!gps) return;
  const here = siteAt(gps.lat, gps.lon);
  if (here && here.id !== settings.activeSiteId) { setActive(here.id, false); toast(`Site actif : ${here.nom}`); }
}
async function init() {
  try { await idbOpen(); } catch (e) { toast('Stockage local indisponible : ' + e.message, 8000); return; }
  const st = await dbGet('settings', 'settings');
  if (st) settings = { ...settings, ...st.value, last: { station: {}, arbre: {}, obs: {}, ...(st.value.last || {}) } };
  (baseLayers[(FONDS[settings.fond] || FONDS.ortho).nom]).addTo(map);
  await loadAll();
  const s = activeSite();
  if (s) map.fitBounds([[s.bbox[1], s.bbox[0]], [s.bbox[3], s.bbox[2]]], { padding: [30, 30] });
  else if (sites.length) { const all = sites.reduce((b, s) => [Math.min(b[0], s.bbox[0]), Math.min(b[1], s.bbox[1]), Math.max(b[2], s.bbox[2]), Math.max(b[3], s.bbox[3])], [180, 90, -180, -90]); map.fitBounds([[all[1], all[0]], [all[3], all[2]]]); }
  startGps();
  if (!sites.length && !points.length) {
    const sh = openSheet(`<h2>Bienvenue dans ChiroTerrain</h2>
      <p>1. Exportez les périmètres de vos sites depuis QGIS en <b>GeoJSON</b> (ou KML), un seul fichier pour toute l'année.</p>
      <p>2. Importez-le ici, puis téléchargez le fond de carte hors ligne de chaque site (Wi-Fi conseillé).</p>
      <p>3. Sur le terrain : <b>+ Station</b>, <b>+ Arbre</b>, <b>+ Observation</b>.</p>
      <label class="f">Vos initiales (observateur)</label><input id="wObs" value="${esc(settings.observateur)}">
      <button class="btn pri" id="wImp">Importer mes périmètres</button><button class="btn" id="wLater">Plus tard</button>`);
    const keep = () => { settings.observateur = $('#wObs', sh).value.trim(); saveSettings(); };
    $('#wImp', sh).onclick = () => { keep(); closeSheet(); pickImport(); };
    $('#wLater', sh).onclick = () => { keep(); closeSheet(); };
  }
}
init();

/* ---------- Service worker (hors ligne + mises à jour) ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const showUpd = w => { $('#updBar').style.display = 'block'; $('#btnUpd').onclick = () => w.postMessage('skipWaiting'); };
    if (reg.waiting) showUpd(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpd(w); }); });
    setInterval(() => reg.update().catch(() => { }), 3600 * 1000);
  }).catch(() => { });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
}
