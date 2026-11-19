/* ChiroTerrain — appli web de terrain (stations, arbres gîtes, observations, habitats, météo) */
'use strict';
const APP = 'ChiroTerrain';
const VERSION = '1.1.1';

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
const DIAMETRES = [{ v: 'PBC', l: 'PBC (0–20 cm)' }, { v: 'MBC', l: 'MBC (20–40 cm)' }, { v: 'GBC', l: 'GBC (40–60 cm)' }, { v: 'TGBC', l: 'TGBC (> 60 cm)' }];
const GITES_DEFAUT = ['Cavité de pic', 'Fissure / fente', 'Écorce décollée', 'Carie / pourriture', 'Branche cassée', 'Lierre dense', 'Trou de nœud', 'Autre'];
const VENT = ['Nul', 'Faible', 'Modéré', 'Fort'];
const PLUIE = ['Nulle', 'Faible', 'Modérée', 'Forte'];

const FORMS = {
  station: [
    { k: 'code', l: 'Code station', t: 'text' },
    { k: 'milieu', l: 'Milieu', t: 'select', opts: MILIEUX },
    { k: 'remarque', l: 'Remarque sur la station', t: 'textarea' },
  ],
  arbre: [
    { k: 'code', l: 'Code', t: 'text' },
    { k: 'essence', l: 'Essence', t: 'datalist', opts: ESSENCES },
    { k: 'diametre', l: 'Diamètre', t: 'chips', opts: DIAMETRES },
    { k: 'gites', l: 'Type(s) de gîte', t: 'multi', opts: () => settings.gites },
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
  poly: [
    { k: 'commentaire', l: 'Commentaire', t: 'textarea', ph: 'Ex. : jolie hêtraie bien ouverte, prairie surpâturée…' },
    { k: 'milieu', l: 'Milieu (facultatif)', t: 'datalist', opts: MILIEUX },
  ],
};
const PASSAGE = [
  { k: 'n', l: 'N° de passage', t: 'number', step: '1' },
  { k: 'detecteur', l: 'Détecteur', t: 'select', opts: () => settings.detecteurs },
  { k: 'date_pose', l: 'Date et heure de pose', t: 'datetime' },
  { k: 'date_releve', l: 'Date et heure de relève', t: 'datetime' },
  { k: 'nb_nuits', l: 'Nombre de nuits', t: 'number', step: '1' },
  { k: 'remarque', l: 'Remarque sur le passage', t: 'textarea' },
];
// Valeurs reprises d'une saisie à l'autre
const MEMO = { station: [], passage: ['detecteur', 'nb_nuits'], arbre: [], obs: [] };

/* ---------- Fonds de carte IGN (Géoplateforme, sans clé) ---------- */
const wmts = (layer, fmt, style = 'normal', base = 'https://data.geopf.fr/wmts?', tms = 'PM') => `${base}SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=${style}&TILEMATRIXSET=${tms}&FORMAT=${fmt}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
const CLE_SCAN_GENERIQUE = 'ign_scan_ws'; // clé générique IGN ; remplaçable dans Réglages par la clé Mica
const scanUrl = () => wmts('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR', 'image/jpeg', 'normal', `https://data.geopf.fr/private/wmts?apikey=${encodeURIComponent(settings.cleScan || CLE_SCAN_GENERIQUE)}&`, 'PM_6_16');
const FONDS = {
  ortho:  { nom: 'Photo aérienne IGN', url: () => wmts('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'), natif: 19, zmin: 12 },
  scan25: { nom: 'Carte IGN (SCAN 25)', url: scanUrl, natif: 16, zmin: 12 },
  plan:   { nom: 'Plan IGN', url: () => wmts('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'), natif: 18, zmin: 12 },
};
const CADASTRE = wmts('CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'image/png', 'PCI%20vecteur');
const TILE_CACHE = 'ct-tuiles';

/* ---------- Utilitaires ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowLocal = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const today = () => nowLocal().slice(0, 10);
const nowIso = () => new Date().toISOString();
const fmtDate = s => s ? s.replace('T', ' ') : '';
const fmtJour = s => s ? s.split('-').reverse().join('/') : '';
const isoLocal = iso => { if (!iso) return ''; const d = new Date(iso); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' '); };
const stamp = () => nowLocal().replace(/[-:]/g, '').replace('T', '-');
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'site';
const optsOf = f => (typeof f.opts === 'function' ? f.opts() : f.opts || []).map(o => typeof o === 'string' ? { v: o, l: o } : o);
function dist(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const fmtDist = m => m == null ? '' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
const fmtSurf = m2 => m2 < 10000 ? `${Math.round(m2)} m²` : `${(m2 / 10000).toFixed(2)} ha`;
let toastT;
function toast(msg, ms = 2500) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', ms); }

/* ---------- Base de données locale (IndexedDB) ---------- */
let DBH;
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('chiroterrain', 2);
    r.onupgradeneeded = e => {
      const d = r.result, old = e.oldVersion;
      if (old < 1) {
        d.createObjectStore('sites', { keyPath: 'id' });
        d.createObjectStore('points', { keyPath: 'id' }).createIndex('siteId', 'siteId');
        d.createObjectStore('photos', { keyPath: 'id' }).createIndex('pointId', 'pointId');
        d.createObjectStore('settings', { keyPath: 'key' });
      }
      if (old < 2) {
        d.createObjectStore('polys', { keyPath: 'id' });
        d.createObjectStore('meteo', { keyPath: 'id' });
        d.createObjectStore('deleted', { keyPath: 'id' });
      }
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
// Suppression tracée (pour que la synchronisation propage la suppression)
async function tombstone(kind, id) { await dbPut('deleted', { id, kind, deletedAt: nowIso() }); }

/* ---------- État ---------- */
let sites = [], points = [], polys = [], meteos = [];
let settings = {
  observateur: '', detecteurs: ['SM4BAT FS', 'SM Mini Bat', 'Batcorder', 'Audiomoth', 'Passive Recorder', 'Batlogger', 'Autre'],
  gites: [...GITES_DEFAUT], zoomMax: 18, fond: 'ortho', cleScan: '', fondsHorsLigne: ['ortho', 'scan25', 'plan'], activeSiteId: null, deviceId: null, lastSync: null,
  last: { station: {}, passage: {}, arbre: {}, obs: {} },
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
const polysOf = g => !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const geomOf = list => !list.length ? null : list.length === 1 ? { type: 'Polygon', coordinates: list[0] } : { type: 'MultiPolygon', coordinates: list };
const inGeom = (lon, lat, g) => polysOf(g).some(p => inRing(lon, lat, p[0]) && !p.slice(1).some(h => inRing(lon, lat, h)));
function bboxOf(...geoms) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  geoms.forEach(g => polysOf(g).forEach(p => p.forEach(r => r.forEach(([x, y]) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }))));
  return b;
}
const fixBbox = s => { s.bbox = bboxOf(s.ze, s.zee); return s; };
const hasGeom = s => !!(s.ze || s.zee);
const inSite = (lat, lon, s) => hasGeom(s) && lon >= s.bbox[0] && lon <= s.bbox[2] && lat >= s.bbox[1] && lat <= s.bbox[3] && (inGeom(lon, lat, s.ze) || inGeom(lon, lat, s.zee));
const siteAt = (lat, lon) => sites.find(s => s.ze && inGeom(lon, lat, s.ze)) || sites.find(s => inSite(lat, lon, s));
function zoneOf(lat, lon, siteId) {
  const s = siteById(siteId); if (!s) return 'hors site';
  if (inGeom(lon, lat, s.ze)) return 'ZE';
  if (inGeom(lon, lat, s.zee)) return 'ZEE';
  return 'hors zone';
}
const siteCenter = s => [(s.bbox[1] + s.bbox[3]) / 2, (s.bbox[0] + s.bbox[2]) / 2];
const siteDist = s => !gps || !hasGeom(s) ? null : inSite(gps.lat, gps.lon, s) ? 0 : dist(gps.lat, gps.lon, ...siteCenter(s));
function areaM2(g) { // surface en Lambert-93
  const ringA = r => { const p = r.map(([x, y]) => toL93(x, y)); let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); };
  return polysOf(g).reduce((t, p) => t + ringA(p[0]) - p.slice(1).reduce((h, r) => h + ringA(r), 0), 0);
}
function fitSite(s) { if (s && hasGeom(s)) map.fitBounds([[s.bbox[1], s.bbox[0]], [s.bbox[3], s.bbox[2]]], { padding: [30, 30] }); }

/* ---------- Carte ---------- */
const map = L.map('map', { zoomControl: false, maxZoom: 20, attributionControl: true }).setView([46.6, 2.5], 6);
map.attributionControl.setPrefix(false);
const baseLayers = {};
for (const f of Object.values(FONDS)) baseLayers[f.nom] = L.tileLayer(f.url(), { maxZoom: 20, maxNativeZoom: f.natif, attribution: '© IGN' });
const refreshScanLayer = () => baseLayers[FONDS.scan25.nom].setUrl(scanUrl());
const cadastre = L.tileLayer(CADASTRE, { maxZoom: 20, maxNativeZoom: 19, minZoom: 13 });
L.control.layers(baseLayers, { 'Cadastre': cadastre }, { position: 'topright' }).addTo(map);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
map.on('baselayerchange', e => { settings.fond = Object.keys(FONDS).find(k => FONDS[k].nom === e.name) || 'ortho'; saveSettings(); });
const sitesLayer = L.layerGroup().addTo(map);
const polysLayer = L.layerGroup().addTo(map);
const pointsLayer = L.layerGroup().addTo(map);
const gpsLayer = L.layerGroup().addTo(map);
map.on('zoomend', () => {
  map.getContainer().classList.toggle('hide-labels', map.getZoom() < 11);
  map.getContainer().classList.toggle('hide-plabels', map.getZoom() < 16);
});

function drawSites() {
  sitesLayer.clearLayers();
  for (const s of sites) {
    const act = s.id === settings.activeSiteId, col = act ? '#ff3b30' : '#ffd400';
    if (s.zee) {
      L.geoJSON(s.zee, { interactive: false, style: { color: '#000', weight: 4, opacity: .4, fill: false } }).addTo(sitesLayer);
      L.geoJSON(s.zee, { interactive: false, style: { color: col, weight: 2, dashArray: '8 6', fill: false } }).addTo(sitesLayer);
    }
    if (s.ze) {
      L.geoJSON(s.ze, { interactive: false, style: { color: '#000', weight: act ? 7 : 5, opacity: .55, fill: false } }).addTo(sitesLayer);
      L.geoJSON(s.ze, { interactive: false, style: { color: col, weight: act ? 3.5 : 2.5, fillOpacity: act ? .06 : 0 } }).addTo(sitesLayer);
    }
    if (hasGeom(s)) L.marker(siteCenter(s), { interactive: false, icon: L.divIcon({ className: 'mkw', html: `<div class="site-label">${esc(s.nom)}</div>`, iconSize: null }) }).addTo(sitesLayer);
  }
}
const lastPassage = p => (p.passages || []).reduce((a, b) => (!a || (b.n || 0) >= (a.n || 0) ? b : a), null);
const isPending = p => { const lp = lastPassage(p); return !!lp && !lp.date_releve; };
function markerHtml(p, n = 0) {
  let code = esc(p.data.code || TYPES[p.type].pre), off = '';
  if (p.type === 'station') { const lp = lastPassage(p); if (lp) code += `<small>P${esc(lp.n)}</small>`; if (!isPending(p)) off = ' off'; }
  const shift = n ? ` style="margin-left:${n * 16}px;margin-top:${n * 16}px"` : '';
  return `<div class="mk mk-${p.type}${off}"${shift}>${code}</div>`;
}
function drawPoints() {
  pointsLayer.clearLayers();
  const seen = new Map(); // décale les points superposés pour qu'ils restent cliquables
  for (const p of points) {
    const key = p.lat.toFixed(5) + ',' + p.lon.toFixed(5), n = seen.get(key) || 0; seen.set(key, n + 1);
    const m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'mkw', html: markerHtml(p, n), iconSize: null }) });
    m.on('click', () => { if (!drawing && !picking) showPoint(p.id); });
    m.addTo(pointsLayer);
  }
}
function drawPolys() {
  polysLayer.clearLayers();
  for (const pg of polys) {
    const l = L.geoJSON(pg.geom, { style: { color: '#b05cff', weight: 2, dashArray: '4 3', fillColor: '#b05cff', fillOpacity: .18 } });
    l.on('click', () => { if (!drawing && !picking) showPoly(pg.id); });
    const txt = (pg.data.commentaire || pg.data.milieu || '').slice(0, 40);
    if (txt) l.bindTooltip(esc(txt), { permanent: true, direction: 'center', className: 'poly-label' });
    l.addTo(polysLayer);
  }
}
function drawAll() { drawSites(); drawPolys(); drawPoints(); refreshHeader(); }
function refreshHeader() {
  const s = activeSite();
  $('#siteName').textContent = s ? s.nom : (sites.length ? 'Choisir un site' : 'Aucun site — importer');
}
function setActive(id, fit = true) {
  settings.activeSiteId = id; saveSettings(); refreshHeader(); drawSites();
  if (fit) fitSite(activeSite());
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
function setFollow(v) { follow = v; $('#btnFollow').classList.toggle('on', v); }
function onPos(pos) {
  const { latitude: lat, longitude: lon, accuracy: acc } = pos.coords;
  gps = { lat, lon, acc, ts: pos.timestamp };
  setChip(`GPS ±${Math.round(acc)} m`, acc <= 10 ? 'ok' : acc <= 30 ? 'warn' : 'bad');
  if (!gpsMk) {
    gpsCircle = L.circle([lat, lon], { radius: acc, color: '#2b7cff', weight: 1, fillOpacity: .12, interactive: false }).addTo(gpsLayer);
    gpsMk = L.marker([lat, lon], { icon: L.divIcon({ className: 'mkw', html: '<div class="gpsdot"></div>', iconSize: null }), interactive: false, zIndexOffset: 1000 }).addTo(gpsLayer);
  } else { gpsMk.setLatLng([lat, lon]); gpsCircle.setLatLng([lat, lon]).setRadius(acc); }
  if (follow && !picking && !drawing) map.panTo([lat, lon]);
  checkGpsSite();
  document.dispatchEvent(new CustomEvent('gps'));
}
function checkGpsSite() {
  if (!gps || picking || drawing) return;
  const here = siteAt(gps.lat, gps.lon);
  if (here && here.id !== settings.activeSiteId) { setActive(here.id, false); toast(`Site actif : ${here.nom}`); }
}
$('#btnFollow').onclick = () => {
  setFollow(!follow);
  if (follow && gps) map.setView([gps.lat, gps.lon], Math.max(map.getZoom(), 17));
  else if (follow) toast('En attente du signal GPS…');
};
map.on('dragstart', () => { if (follow) setFollow(false); });
$('#btnFit').onclick = () => { const s = activeSite(); if (s && hasGeom(s)) fitSite(s); else openSites(); };
$('#btnMeteo').onclick = () => openMeteo();

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
function choiceSheet(title, msg, choices) { // choices: [{v, l, cls}]
  return new Promise(res => {
    const sh = openSheet(`<h2>${esc(title)}</h2>${msg ? `<p>${msg}</p>` : ''}${choices.map((c, i) => `<button class="btn ${c.cls || ''}" data-i="${i}">${esc(c.l)}</button>`).join('')}<button class="btn" data-i="-1">Annuler</button>`);
    sh.onclick = e => { const i = e.target.dataset.i; if (i == null) return; closeSheet(); res(i === '-1' ? null : choices[+i].v); };
  });
}
function pickSite(title) {
  if (!sites.length) { toast('Aucun site : importez ou créez un site d\'abord'); return Promise.resolve(null); }
  return choiceSheet(title, '', [...sites].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(s => ({ v: s.id, l: s.nom })));
}

/* ---------- Viseur (placer / déplacer sur la carte) ---------- */
let picking = false;
function pickOnMap(title, center) {
  return new Promise(res => {
    closeSheet(); setFollow(false); picking = true;
    if (center) map.setView(center, Math.max(map.getZoom(), 18)); // sinon : la carte ne bouge pas
    $('#cross').style.display = 'block';
    const bar = $('#crossBar'); bar.style.display = 'block';
    bar.innerHTML = `<p><b>${esc(title)}</b><br><span class="mut">Déplacez la carte pour placer la croix rouge sur le point.</span></p>
      <div class="row"><button class="btn pri" id="xOk">Valider</button><button class="btn" id="xGps">Aller à ma position</button><button class="btn" id="xNo">Annuler</button></div>`;
    const end = v => { picking = false; $('#cross').style.display = 'none'; bar.style.display = 'none'; res(v); };
    $('#xOk').onclick = () => { const c = map.getCenter(); end({ lat: c.lat, lon: c.lng, acc: null, source: 'carte' }); };
    $('#xGps').onclick = () => { if (gps) map.setView([gps.lat, gps.lon], Math.max(map.getZoom(), 18)); else toast('Pas encore de position GPS'); };
    $('#xNo').onclick = () => end(null);
  });
}

/* ---------- Dessin de polygone ---------- */
let drawing = false;
function drawPolygon(title, color = '#b05cff') {
  return new Promise(res => {
    closeSheet(); setFollow(false); drawing = true;
    const verts = [];
    const line = L.polyline([], { color, weight: 3, dashArray: '6 4', interactive: false }).addTo(map);
    const fill = L.polygon([], { stroke: false, fillColor: color, fillOpacity: .25, interactive: false }).addTo(map);
    const vl = L.layerGroup().addTo(map);
    const bar = $('#crossBar'); bar.style.display = 'block';
    const end = v => { map.off('click', onClick); [line, fill, vl].forEach(l => map.removeLayer(l)); bar.style.display = 'none'; drawing = false; res(v); };
    const render = () => {
      line.setLatLngs(verts.length > 2 ? [...verts, verts[0]] : verts); fill.setLatLngs(verts.length > 2 ? verts : []);
      vl.clearLayers(); verts.forEach(v => L.circleMarker(v, { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1, interactive: false }).addTo(vl));
      bar.innerHTML = `<p><b>${esc(title)}</b><br><span class="mut">Touchez la carte pour placer les sommets — ${verts.length} sommet(s)${verts.length > 2 ? ' · ' + fmtSurf(areaM2({ type: 'Polygon', coordinates: [[...verts, verts[0]].map(v => [v.lng, v.lat])] })) : ''}</span></p>
        <div class="row"><button class="btn" id="dGps">+ Ma position GPS</button><button class="btn" id="dUndo"${verts.length ? '' : ' disabled'}>Retirer le dernier</button></div>
        <div class="row"><button class="btn pri" id="dOk"${verts.length >= 3 ? '' : ' disabled'}>Terminer</button><button class="btn" id="dNo">Annuler</button></div>`;
      $('#dGps').onclick = () => { if (gps) { verts.push(L.latLng(gps.lat, gps.lon)); render(); } else toast('Pas encore de position GPS'); };
      $('#dUndo').onclick = () => { verts.pop(); render(); };
      $('#dOk').onclick = () => { const ring = verts.map(v => [v.lng, v.lat]); ring.push(ring[0]); end({ type: 'Polygon', coordinates: [ring] }); };
      $('#dNo').onclick = () => end(null);
    };
    const onClick = e => { verts.push(e.latlng); render(); };
    map.on('click', onClick); render();
  });
}

/* ---------- Ajout d'un point ---------- */
$$('[data-add]').forEach(b => b.onclick = () => b.dataset.add === 'poly' ? addPoly() : startAdd(b.dataset.add));
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
  $('#aMap', sh).onclick = async () => { done(); const loc = await pickOnMap(`Placer : ${T.court.toLowerCase()}`, null); if (loc) openForm(type, null, loc); };
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
      if (stop) return; stop = true; clearInterval(iv); document.removeEventListener('gps', add); closeSheet();
      if (!pts.length) { toast('Aucune position reçue'); return res(null); }
      let sw = 0, la = 0, lo = 0; pts.forEach(p => { const w = 1 / Math.max(p.acc, 1) ** 2; sw += w; la += p.lat * w; lo += p.lon * w; });
      res({ lat: la / sw, lon: lo / sw, acc: Math.round(Math.min(...pts.map(p => p.acc)) * 10) / 10, source: `gps moyenné (${pts.length} pos.)` });
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

/* ---------- Champs de formulaire ---------- */
function fieldHtml(f, v, pre = '') {
  const name = pre + f.k, id = 'f_' + name;
  let h = `<label class="f" for="${id}">${esc(f.l)}</label>`;
  switch (f.t) {
    case 'text': return h + `<input id="${id}" name="${name}" value="${esc(v)}">`;
    case 'number': return h + `<input id="${id}" name="${name}" type="number" inputmode="decimal" step="${f.step || 'any'}" value="${esc(v)}">`;
    case 'textarea': return h + `<textarea id="${id}" name="${name}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
    case 'datetime': return h + `<div class="inl"><input id="${id}" name="${name}" type="datetime-local" value="${esc(v)}"><button type="button" class="btn sm" data-now="${id}">Maintenant</button><button type="button" class="btn sm" data-clear="${id}">×</button></div>`;
    case 'select': {
      const list = optsOf(f); if (v && !list.some(o => o.v === v)) list.push({ v, l: v });
      return h + `<select id="${id}" name="${name}"><option value=""></option>${list.map(o => `<option value="${esc(o.v)}"${o.v === v ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
    }
    case 'datalist': return h + `<input id="${id}" name="${name}" list="dl_${name}" value="${esc(v)}" autocomplete="off"><datalist id="dl_${name}">${optsOf(f).map(o => `<option value="${esc(o.v)}">`).join('')}</datalist>`;
    case 'chips': case 'multi': {
      const sel = Array.isArray(v) ? v : (v ? [v] : []);
      const list = optsOf(f); sel.forEach(s => { if (!list.some(o => o.v === s)) list.push({ v: s, l: s }); });
      return h + `<div class="chips" data-k="${name}" data-multi="${f.t === 'multi' ? 1 : 0}">${list.map(o => `<button type="button" data-v="${esc(o.v)}" class="${sel.includes(o.v) ? 'on' : ''}">${esc(o.l)}</button>`).join('')}</div>`;
    }
  }
  return '';
}
function readFields(root, fields, pre = '') {
  const d = {};
  for (const f of fields) {
    const name = pre + f.k;
    if (f.t === 'chips' || f.t === 'multi') {
      const on = $$(`.chips[data-k="${name}"] button.on`, root).map(b => b.dataset.v);
      d[f.k] = f.t === 'multi' ? on : (on[0] || '');
    } else {
      const el = $(`[name="${name}"]`, root); let v = el ? el.value.trim() : '';
      if (f.t === 'number' && v !== '') v = Number(v.replace(',', '.'));
      d[f.k] = v;
    }
  }
  return d;
}
function bindFormUi(sh) {
  sh.addEventListener('click', e => {
    const b = e.target.closest('.chips button');
    if (b) { const c = b.parentElement; if (c.dataset.multi !== '1') { const was = b.classList.contains('on'); $$('button', c).forEach(x => x.classList.remove('on')); if (!was) b.classList.add('on'); } else b.classList.toggle('on'); }
    if (e.target.dataset.now) $('#' + e.target.dataset.now, sh).value = nowLocal();
    if (e.target.dataset.clear) $('#' + e.target.dataset.clear, sh).value = '';
  });
}
function valueLabel(f, v) {
  if (Array.isArray(v)) return v.join(', ');
  if (f.t === 'datetime') return fmtDate(v);
  if (f.t === 'chips' || f.t === 'select') { const o = optsOf(f).find(o => o.v === v); return o ? o.l : v; }
  return v;
}
const kvRows = (fields, data, skip = []) => fields.filter(f => !skip.includes(f.k)).map(f => {
  const v = valueLabel(f, data[f.k]);
  return v === '' || v == null || (Array.isArray(v) && !v.length) ? '' : `<tr><td>${esc(f.l)}</td><td>${esc(v)}</td></tr>`;
}).join('');
async function resizeImage(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82));
  } catch (e) { return file; }
}
const siteOptions = sel => [...sites].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(s => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${esc(s.nom)}</option>`).join('');

/* ---------- Formulaire point (station + passage, arbre, observation) ---------- */
// passageMode : null (station seule), 'new' (nouveau passage) ou id d'un passage à modifier
async function openForm(type, point, loc, passageMode = null) {
  const T = TYPES[type], isNew = !point;
  if (type === 'station' && isNew) passageMode = 'new';
  let siteId = point ? point.siteId : ((siteAt(loc.lat, loc.lon) || activeSite() || {}).id || null);
  const data = point ? { ...point.data } : {};
  if (isNew) {
    for (const k of MEMO[type]) if (settings.last[type][k] != null) data[k] = settings.last[type][k];
    data.code = nextCode(type, siteId);
  }
  let pdata = null;
  if (passageMode === 'new') {
    const lp = point ? lastPassage(point) : null;
    pdata = { n: lp ? (+lp.n || 0) + 1 : 1, date_pose: nowLocal() };
    for (const k of MEMO.passage) { const v = lp ? lp[k] : settings.last.passage[k]; if (v != null && v !== '') pdata[k] = v; }
  } else if (passageMode) pdata = { ...(point.passages.find(x => x.id === passageMode) || {}) };
  let autoCode = isNew ? data.code : null;
  const photos = point ? (await photosOf(point.id)).map(p => ({ ...p, url: URL.createObjectURL(p.blob) })) : [];
  const removed = [];
  const where = point || loc;
  const titre = isNew ? 'Nouveau point' : passageMode === 'new' ? `Nouveau passage` : passageMode ? `Passage ${esc(pdata.n)}` : 'Modifier';
  const sh = openSheet(`<h2><span class="badge bg-${T.cls}">${T.court}</span> ${titre}</h2>
    <p class="mut">${where.lat.toFixed(6)}, ${where.lon.toFixed(6)} — ${esc(where.source || '')}${where.acc ? ` ±${where.acc} m` : ''}</p>
    <label class="f" for="f_site">Site</label><select id="f_site"><option value="">Hors site</option>${siteOptions(siteId)}</select>
    <div id="frm">${FORMS[type].map(f => fieldHtml(f, data[f.k])).join('')}</div>
    ${pdata ? `<h3>Passage</h3><div id="pfrm">${PASSAGE.map(f => fieldHtml(f, pdata[f.k], 'p_')).join('')}</div>` : ''}
    <label class="f">Photos</label><div class="thumbs" id="thumbs"></div>
    <label class="btn" for="phIn">Ajouter une photo</label><input id="phIn" type="file" accept="image/*" capture="environment" multiple hidden>
    <button class="btn ${T.cls}" id="fSave">Enregistrer</button>
    ${pdata && passageMode !== 'new' ? '<button class="btn dan" id="fDelP">Supprimer ce passage</button>' : ''}
    <button class="btn" id="fNo">Annuler</button>`);
  sheetLock = true; bindFormUi(sh);
  const drawThumbs = () => { $('#thumbs', sh).innerHTML = photos.map((p, i) => `<div><img src="${p.url}" data-i="${i}"><button class="x" data-del="${i}">×</button></div>`).join(''); };
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
  $('#f_site', sh).onchange = e => {
    const c = $('[name="code"]', sh);
    if (autoCode && c.value === autoCode) { autoCode = nextCode(type, e.target.value || null); c.value = autoCode; }
  };
  $('#fNo', sh).onclick = closeSheet;
  if ($('#fDelP', sh)) $('#fDelP', sh).onclick = async () => {
    if (!await confirmSheet(`Supprimer le passage ${esc(pdata.n)} de la station ${esc(point.data.code)} ?`, 'Supprimer')) return openForm(type, point, null, passageMode);
    point.passages = point.passages.filter(x => x.id !== passageMode); point.updatedAt = nowIso();
    await dbPut('points', point); drawPoints(); toast('Passage supprimé');
  };
  $('#fSave', sh).onclick = async () => {
    const d = readFields(sh, FORMS[type]);
    const p = point || { id: uuid(), type, lat: loc.lat, lon: loc.lon, acc: loc.acc, source: loc.source, createdAt: nowIso(), observateur: settings.observateur, photoIds: [] };
    if (type === 'station' && !p.passages) p.passages = [];
    p.siteId = $('#f_site', sh).value || null; p.data = d; p.updatedAt = nowIso();
    if (pdata) {
      const pd = readFields(sh, PASSAGE, 'p_');
      if (passageMode === 'new') p.passages.push({ id: uuid(), ...pd, observateur: settings.observateur, createdAt: nowIso() });
      else Object.assign(p.passages.find(x => x.id === passageMode), pd);
      p.passages.sort((a, b) => (+a.n || 0) - (+b.n || 0));
      for (const k of MEMO.passage) if (pd[k] !== '' && pd[k] != null) settings.last.passage[k] = pd[k];
    }
    for (const id of removed) await dbDel('photos', id);
    for (const ph of photos.filter(x => x.isNew)) await dbPut('photos', { id: ph.id, pointId: p.id, blob: ph.blob, ts: Date.now() });
    p.photoIds = photos.map(x => x.id);
    await dbPut('points', p);
    if (isNew) points.push(p);
    for (const k of MEMO[type]) if (d[k] !== '' && d[k] != null) settings.last[type][k] = d[k];
    saveSettings(); askPersist(); closeSheet(); drawPoints();
    let msg = `${T.court} ${d.code || ''} enregistrée`;
    if (type === 'station' && passageMode === 'new' && p.siteId && !meteos.some(m => m.siteId === p.siteId && m.date === today())) msg += ' — pensez à la météo du jour';
    toast(msg, 3500);
  };
}
function viewPhoto(url) { const v = $('#photoView'); $('img', v).src = url; v.style.display = 'flex'; v.onclick = () => v.style.display = 'none'; }

/* ---------- Fiche d'un point ---------- */
async function showPoint(id) {
  const p = points.find(x => x.id === id); if (!p) return;
  const T = TYPES[p.type], s = siteById(p.siteId);
  const [x, y] = toL93(p.lon, p.lat);
  const ph = await photosOf(p.id);
  const d = gps ? dist(gps.lat, gps.lon, p.lat, p.lon) : null;
  const passages = p.type === 'station' ? `<h3>Passages (${p.passages.length})</h3>
    <ul class="list" id="pPass">${[...p.passages].reverse().map(a => `<li><div class="t"><b>Passage ${esc(a.n)} — ${esc(a.detecteur || 'détecteur ?')}</b>
      <small>pose ${esc(fmtDate(a.date_pose)) || '?'}${a.date_releve ? ` · relève ${esc(fmtDate(a.date_releve))}` : ' · <b>en place</b>'}${a.nb_nuits ? ` · ${esc(a.nb_nuits)} nuit(s)` : ''}${a.remarque ? '<br>' + esc(a.remarque) : ''}</small></div>
      ${a.date_releve ? '' : `<button class="btn sm st" data-rel="${a.id}">Relever</button>`}<button class="btn sm" data-edp="${a.id}">Modifier</button></li>`).join('')}</ul>
    <button class="btn st" id="pAddP">+ Ajouter un passage</button>` : '';
  const sh = openSheet(`<h2><span class="badge bg-${T.cls}">${T.court}</span> ${esc(p.data.code || '')}</h2>
    <p class="mut">${esc(s ? s.nom : 'Hors site')} · ${zoneOf(p.lat, p.lon, p.siteId)}${d != null ? ` · à ${fmtDist(d)}` : ''}</p>
    ${passages}
    <table class="kv">${kvRows(FORMS[p.type], p.data, ['code'])}
      <tr><td>Position</td><td>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}<br>L93 : ${Math.round(x)} / ${Math.round(y)}<br><span class="mut">${esc(p.source || '')}${p.acc ? ` ±${p.acc} m` : ''}</span></td></tr>
      <tr><td>Saisi</td><td>${esc(isoLocal(p.createdAt))} ${esc(p.observateur || '')}</td></tr></table>
    <div class="thumbs" id="pThumbs">${ph.map((f, i) => `<div><img data-i="${i}" src="${URL.createObjectURL(f.blob)}"></div>`).join('')}</div>
    <div class="row"><button class="btn pri" id="pEdit">Modifier ${p.type === 'station' ? 'la station' : ''}</button><button class="btn" id="pMove">Déplacer</button></div>
    <div class="row"><a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">Itinéraire</a><button class="btn dan" id="pDel">Supprimer</button></div>
    <button class="btn" id="pClose">Fermer</button>`);
  $('#pThumbs', sh).onclick = e => { if (e.target.dataset.i != null) viewPhoto(e.target.src); };
  $('#pClose', sh).onclick = closeSheet;
  $('#pEdit', sh).onclick = () => openForm(p.type, p);
  if (p.type === 'station') {
    $('#pAddP', sh).onclick = () => openForm('station', p, null, 'new');
    $('#pPass', sh).onclick = async e => {
      const rel = e.target.dataset.rel, edp = e.target.dataset.edp;
      if (edp) openForm('station', p, null, edp);
      if (rel) await releve(p, rel);
    };
  }
  $('#pMove', sh).onclick = async () => {
    const loc = await pickOnMap(`Déplacer ${p.data.code || ''}`, [p.lat, p.lon]);
    if (!loc) return;
    Object.assign(p, { lat: loc.lat, lon: loc.lon, acc: loc.acc, source: 'carte (déplacé)', updatedAt: nowIso() });
    await dbPut('points', p); drawPoints(); toast('Point déplacé');
  };
  $('#pDel', sh).onclick = async () => {
    if (!await confirmSheet(`Supprimer ${esc(T.court.toLowerCase())} ${esc(p.data.code || '')}${p.type === 'station' ? ` (${p.passages.length} passage(s))` : ''} et ses photos ?`, 'Supprimer')) return;
    await deletePoint(p); drawPoints(); toast('Point supprimé');
  };
}
async function releve(p, passageId) {
  const a = p.passages.find(x => x.id === passageId); if (!a) return;
  a.date_releve = nowLocal(); p.updatedAt = nowIso(); await dbPut('points', p); drawPoints();
  toast(`Station ${p.data.code} — passage ${a.n} relevé`); closeSheet();
}
async function deletePoint(p) {
  for (const f of await photosOf(p.id)) await dbDel('photos', f.id);
  await dbDel('points', p.id); await tombstone('point', p.id); points = points.filter(x => x.id !== p.id);
}

/* ---------- Polygones commentés (habitats) ---------- */
async function addPoly() {
  const geom = await drawPolygon('Nouveau polygone');
  if (geom) openPolyForm(null, geom);
}
function openPolyForm(pg, geom) {
  const isNew = !pg; const g = pg ? pg.geom : geom;
  const ring = g.coordinates[0]; const c = ring.reduce((a, [x, y]) => [a[0] + y / ring.length, a[1] + x / ring.length], [0, 0]);
  const siteId = pg ? pg.siteId : ((siteAt(c[0], c[1]) || activeSite() || {}).id || null);
  const sh = openSheet(`<h2><span class="badge bg-pg">Polygone</span> ${isNew ? 'Nouveau' : 'Modifier'}</h2>
    <p class="mut">${fmtSurf(areaM2(g))}</p>
    <label class="f" for="f_site">Site</label><select id="f_site"><option value="">Hors site</option>${siteOptions(siteId)}</select>
    ${FORMS.poly.map(f => fieldHtml(f, pg ? pg.data[f.k] : '')).join('')}
    <button class="btn pg" id="gSave">Enregistrer</button><button class="btn" id="gNo">Annuler</button>`);
  sheetLock = true; bindFormUi(sh);
  setTimeout(() => { const t = $('[name="commentaire"]', sh); if (t && isNew) t.focus(); }, 200);
  $('#gNo', sh).onclick = closeSheet;
  $('#gSave', sh).onclick = async () => {
    const p = pg || { id: uuid(), geom: g, createdAt: nowIso(), observateur: settings.observateur };
    p.siteId = $('#f_site', sh).value || null; p.data = readFields(sh, FORMS.poly); p.updatedAt = nowIso();
    await dbPut('polys', p); if (isNew) polys.push(p);
    closeSheet(); drawPolys(); toast('Polygone enregistré');
  };
}
function showPoly(id) {
  const pg = polys.find(x => x.id === id); if (!pg) return;
  const s = siteById(pg.siteId);
  const sh = openSheet(`<h2><span class="badge bg-pg">Polygone</span> ${esc(pg.data.milieu || '')}</h2>
    <p class="mut">${esc(s ? s.nom : 'Hors site')} · ${fmtSurf(areaM2(pg.geom))}</p>
    <p>${esc(pg.data.commentaire || '')}</p><p class="mut">Saisi ${esc(isoLocal(pg.createdAt))} ${esc(pg.observateur || '')}</p>
    <div class="row"><button class="btn pri" id="gEdit">Modifier</button><button class="btn" id="gRedraw">Redessiner</button></div>
    <button class="btn dan" id="gDel">Supprimer</button><button class="btn" id="gClose">Fermer</button>`);
  $('#gClose', sh).onclick = closeSheet;
  $('#gEdit', sh).onclick = () => openPolyForm(pg);
  $('#gRedraw', sh).onclick = async () => { const g = await drawPolygon('Redessiner le polygone'); if (!g) return; pg.geom = g; pg.updatedAt = nowIso(); await dbPut('polys', pg); drawPolys(); toast('Polygone redessiné'); };
  $('#gDel', sh).onclick = async () => {
    if (!await confirmSheet('Supprimer ce polygone ?', 'Supprimer')) return;
    await dbDel('polys', pg.id); await tombstone('poly', pg.id); polys = polys.filter(x => x.id !== pg.id); drawPolys(); toast('Polygone supprimé');
  };
}

/* ---------- Météo du jour ---------- */
async function openMeteo(siteId, date) {
  siteId = siteId || settings.activeSiteId;
  if (!siteId) { siteId = await pickSite('Météo : choisir le site'); if (!siteId) return; }
  date = date || today();
  const s = siteById(siteId); const id = `${siteId}|${date}`;
  const m = meteos.find(x => x.id === id) || {};
  const hist = meteos.filter(x => x.siteId === siteId && x.date !== date).sort((a, b) => b.date.localeCompare(a.date));
  const sh = openSheet(`<h2>Météo — ${esc(s ? s.nom : '')}</h2>
    <label class="f">Site</label><select id="mSite">${siteOptions(siteId)}</select>
    <label class="f">Jour</label><input type="date" id="mDate" value="${date}">
    <label class="f">Température au coucher du soleil (°C)</label><input id="mTemp" type="number" inputmode="decimal" step="0.5" value="${esc(m.temp_coucher ?? '')}">
    ${fieldHtml({ k: 'vent', l: 'Vent', t: 'chips', opts: VENT }, m.vent)}
    ${fieldHtml({ k: 'pluie', l: 'Pluie', t: 'chips', opts: PLUIE }, m.pluie)}
    ${fieldHtml({ k: 'remarque', l: 'Remarque', t: 'textarea' }, m.remarque)}
    <button class="btn pri" id="mSave">Enregistrer</button><button class="btn" id="mNo">Fermer</button>
    ${hist.length ? `<h3>Jours précédents</h3><ul class="list" id="mHist">${hist.map(h => `<li><div class="t" data-d="${h.date}"><b>${fmtJour(h.date)}</b><small>${h.temp_coucher !== '' && h.temp_coucher != null ? esc(h.temp_coucher) + ' °C · ' : ''}vent ${esc((h.vent || '?').toLowerCase())} · pluie ${esc((h.pluie || '?').toLowerCase())}</small></div></li>`).join('')}</ul>` : ''}`);
  sheetLock = true; bindFormUi(sh);
  $('#mSite', sh).onchange = e => openMeteo(e.target.value, $('#mDate', sh).value);
  $('#mDate', sh).onchange = e => openMeteo($('#mSite', sh).value, e.target.value || today());
  if ($('#mHist', sh)) $('#mHist', sh).onclick = e => { const d = e.target.closest('[data-d]'); if (d) openMeteo(siteId, d.dataset.d); };
  $('#mNo', sh).onclick = closeSheet;
  $('#mSave', sh).onclick = async () => {
    const t = $('#mTemp', sh).value.trim();
    const d = readFields(sh, [{ k: 'vent', t: 'chips' }, { k: 'pluie', t: 'chips' }, { k: 'remarque', t: 'textarea' }]);
    const rec = { id, siteId, date, temp_coucher: t === '' ? '' : Number(t.replace(',', '.')), ...d, observateur: settings.observateur, createdAt: m.createdAt || nowIso(), updatedAt: nowIso() };
    await dbPut('meteo', rec); meteos = meteos.filter(x => x.id !== id).concat(rec);
    closeSheet(); toast(`Météo du ${fmtJour(date)} enregistrée`);
  };
}

/* ---------- Liste des sites ---------- */
function openSites() {
  const list = [...sites].map(s => ({ s, d: siteDist(s) })).sort((a, b) => (a.d ?? 1e12) - (b.d ?? 1e12) || a.s.nom.localeCompare(b.s.nom, 'fr'));
  const cnt = (id, t) => points.filter(p => p.siteId === id && p.type === t).length;
  const sh = openSheet(`<h2>Sites d'étude (${sites.length})</h2>
    ${sites.length > 6 ? '<input id="sSearch" placeholder="Rechercher un site…">' : ''}
    <ul class="list" id="sList">${list.map(({ s, d }) => `<li class="${s.id === settings.activeSiteId ? 'act' : ''}">
      <div class="t" data-go="${s.id}"><b>${esc(s.nom)}</b><small>${esc(s.annee || '')}${d != null ? ' · ' + (d === 0 ? 'vous y êtes' : fmtDist(d)) : ''}
      · ${s.ze ? 'ZE' : '<s>ZE</s>'} ${s.zee ? 'ZEE' : '<s>ZEE</s>'}
      · <span class="badge bg-st">${cnt(s.id, 'station')}</span><span class="badge bg-ar">${cnt(s.id, 'arbre')}</span><span class="badge bg-ob">${cnt(s.id, 'obs')}</span><span class="badge bg-pg">${polys.filter(p => p.siteId === s.id).length}</span>
      ${s.offline ? ' · hors ligne ✓' : ''}</small></div>
      <button class="btn sm" data-more="${s.id}">…</button></li>`).join('')}</ul>
    ${sites.length ? '' : '<p class="mut">Aucun site. Importez vos périmètres (GeoJSON ou KML exporté de QGIS), recevez-les depuis ChiroThèque, ou dessinez-les.</p>'}
    <button class="btn pri" id="sImp">Importer des périmètres (GeoJSON / KML)</button>
    <button class="btn" id="sNew">Créer un site en dessinant sa ZE</button>
    ${sites.length ? '<button class="btn" id="sAllOff">Télécharger le fond hors ligne de tous les sites</button>' : ''}
    <button class="btn" id="sClose">Fermer</button>`);
  if ($('#sSearch', sh)) $('#sSearch', sh).oninput = e => { const q = e.target.value.toLowerCase(); $$('#sList li', sh).forEach(li => li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  $('#sList', sh).onclick = e => {
    const go = e.target.closest('[data-go]'), more = e.target.closest('[data-more]');
    if (go) { closeSheet(); setActive(go.dataset.go); }
    if (more) siteMenu(siteById(more.dataset.more));
  };
  $('#sImp', sh).onclick = pickImport;
  $('#sNew', sh).onclick = newSite;
  if ($('#sAllOff', sh)) $('#sAllOff', sh).onclick = () => downloadTiles(sites.filter(hasGeom));
  $('#sClose', sh).onclick = closeSheet;
}
$('#btnSite').onclick = openSites;
async function newSite() {
  const g = await drawPolygon('Nouveau site : dessinez la zone d\'étude (ZE)', '#ffd400');
  if (!g) return;
  const sh = openSheet(`<h2>Nouveau site</h2><label class="f">Nom du site</label><input id="nNom"><label class="f">Année</label><input id="nAn" value="${new Date().getFullYear()}">
    <button class="btn pri" id="nOk">Créer</button><button class="btn" id="nNo">Annuler</button>`);
  sheetLock = true; setTimeout(() => $('#nNom', sh).focus(), 200);
  $('#nNo', sh).onclick = closeSheet;
  $('#nOk', sh).onclick = async () => {
    const nom = $('#nNom', sh).value.trim(); if (!nom) { toast('Donnez un nom au site'); return; }
    const s = fixBbox({ id: uuid(), nom, annee: $('#nAn', sh).value.trim(), ze: g, zee: null, props: {}, createdAt: nowIso(), updatedAt: nowIso() });
    await dbPut('sites', s); sites.push(s); closeSheet(); setActive(s.id); toast('Site créé');
  };
}
async function drawZone(s, zone) {
  let mode = 'replace';
  if (s[zone]) { mode = await choiceSheet(`${zone} de « ${s.nom} »`, `Ce site a déjà une ${zone}.`, [{ v: 'replace', l: `Remplacer la ${zone}`, cls: 'pri' }, { v: 'add', l: 'Ajouter une partie supplémentaire' }]); if (!mode) return; }
  fitSite(s);
  const g = await drawPolygon(`Dessiner la ${zone} de « ${s.nom} »`, zone === 'ZE' ? '#ffd400' : '#ff9f0a');
  if (!g) return;
  s[zone.toLowerCase()] = mode === 'add' ? geomOf([...polysOf(s[zone.toLowerCase()]), ...polysOf(g)]) : g;
  fixBbox(s); s.updatedAt = nowIso(); await dbPut('sites', s); drawSites(); toast(`${zone} enregistrée`);
}
function siteMenu(s) {
  const n = points.filter(p => p.siteId === s.id).length + polys.filter(p => p.siteId === s.id).length;
  const sh = openSheet(`<h2>${esc(s.nom)}</h2><p class="mut">${n} élément(s)${s.offline ? ` · fond hors ligne téléchargé le ${esc(fmtJour(s.offline.date))} (${s.offline.n} tuiles)` : ''}</p>
    <button class="btn pri" id="mAct">Voir et activer ce site</button>
    <button class="btn" id="mMet">Météo</button>
    <button class="btn" id="mOff"${hasGeom(s) ? '' : ' disabled'}>${s.offline ? 'Mettre à jour' : 'Télécharger'} le fond hors ligne</button>
    <div class="row"><button class="btn" id="mZE">${s.ze ? 'Redessiner' : 'Dessiner'} la ZE</button><button class="btn" id="mZEE">${s.zee ? 'Redessiner' : 'Dessiner'} la ZEE</button></div>
    <button class="btn" id="mExp">Exporter ce site pour QGIS</button>
    <button class="btn" id="mRen">Renommer</button>
    <button class="btn dan" id="mDel">Supprimer le site</button>
    <button class="btn" id="mBack">Retour</button>`);
  $('#mAct', sh).onclick = () => { closeSheet(); setActive(s.id); };
  $('#mMet', sh).onclick = () => openMeteo(s.id);
  $('#mOff', sh).onclick = () => downloadTiles([s]);
  $('#mZE', sh).onclick = () => drawZone(s, 'ZE');
  $('#mZEE', sh).onclick = () => drawZone(s, 'ZEE');
  $('#mExp', sh).onclick = () => exportQgis([s.id]);
  $('#mBack', sh).onclick = openSites;
  $('#mRen', sh).onclick = () => {
    const sh2 = openSheet(`<h2>Renommer</h2><input id="rn" value="${esc(s.nom)}"><label class="f">Année</label><input id="ra" value="${esc(s.annee || '')}"><button class="btn pri" id="rOk">Enregistrer</button><button class="btn" id="rNo">Annuler</button>`);
    $('#rOk', sh2).onclick = async () => { s.nom = $('#rn', sh2).value.trim() || s.nom; s.annee = $('#ra', sh2).value.trim(); s.updatedAt = nowIso(); await dbPut('sites', s); drawSites(); refreshHeader(); siteMenu(s); };
    $('#rNo', sh2).onclick = () => siteMenu(s);
  };
  $('#mDel', sh).onclick = () => {
    const sh2 = openSheet(`<h2>Supprimer « ${esc(s.nom)} »</h2>
      ${n ? `<p>Ce site contient <b>${n} élément(s)</b> (points, polygones). Pensez à synchroniser avant.</p><button class="btn dan" id="dAll">Supprimer le site et ses ${n} éléments</button><button class="btn" id="dPer">Supprimer seulement le site (éléments gardés « hors site »)</button>` : `<button class="btn dan" id="dPer">Supprimer</button>`}
      <button class="btn" id="dNo">Annuler</button>`);
    const del = async withAll => {
      for (const p of points.filter(p => p.siteId === s.id)) { if (withAll) await deletePoint(p); else { p.siteId = null; p.updatedAt = nowIso(); await dbPut('points', p); } }
      for (const pg of polys.filter(p => p.siteId === s.id)) {
        if (withAll) { await dbDel('polys', pg.id); await tombstone('poly', pg.id); } else { pg.siteId = null; pg.updatedAt = nowIso(); await dbPut('polys', pg); }
      }
      if (withAll) polys = polys.filter(p => p.siteId !== s.id);
      await dbDel('sites', s.id); await tombstone('site', s.id); sites = sites.filter(x => x.id !== s.id);
      if (settings.activeSiteId === s.id) settings.activeSiteId = null;
      saveSettings(); drawAll(); openSites();
    };
    if ($('#dAll', sh2)) $('#dAll', sh2).onclick = () => del(true);
    $('#dPer', sh2).onclick = () => del(false);
    $('#dNo', sh2).onclick = () => siteMenu(s);
  };
}

/* ---------- Import des périmètres (GeoJSON / KML) ---------- */
function pickFile(accept, cb) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
  inp.onchange = () => inp.files[0] && cb(inp.files[0]); inp.click();
}
const pickImport = () => pickFile('.geojson,.json,.kml,application/json,application/geo+json,application/vnd.google-earth.kml+xml', importFile);
function kmlToFeatures(txt) {
  const doc = new DOMParser().parseFromString(txt, 'text/xml');
  const ring = el => el.textContent.trim().split(/\s+/).map(t => t.split(',').map(Number)).filter(c => c.length >= 2 && !isNaN(c[0])).map(c => [c[0], c[1]]);
  return [...doc.getElementsByTagName('Placemark')].map(pm => {
    const props = { name: (pm.getElementsByTagName('name')[0] || {}).textContent || '' };
    [...pm.getElementsByTagName('Data')].forEach(d => props[d.getAttribute('name')] = (d.getElementsByTagName('value')[0] || {}).textContent);
    [...pm.getElementsByTagName('SimpleData')].forEach(d => props[d.getAttribute('name')] = d.textContent);
    const ps = [...pm.getElementsByTagName('Polygon')].map(pg => {
      const outer = pg.getElementsByTagName('outerBoundaryIs')[0], inners = [...pg.getElementsByTagName('innerBoundaryIs')];
      return [ring(outer.getElementsByTagName('coordinates')[0]), ...inners.map(i => ring(i.getElementsByTagName('coordinates')[0]))];
    });
    return ps.length ? { type: 'Feature', properties: props, geometry: geomOf(ps) } : null;
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
      if (gj.format === 'chirosync' || gj.format === 'chiroterrain-sauvegarde') return importSyncData(gj, new Map());
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
  const zguess = keys.find(k => /^(zone|type|type_?zone|zonage)$/i.test(k)) || '';
  const fname = file.name.toLowerCase();
  const zdef = /zee|elarg|élarg/.test(fname) ? 'ZEE' : zguess ? 'champ' : 'ZE';
  const sh = openSheet(`<h2>Importer ${feats.length} polygone(s)</h2>
    <p class="mut">${esc(file.name)}${crs ? ` — converti depuis ${crs}` : ' — WGS84'}</p>
    <label class="f">Champ contenant le nom du site</label>
    <select id="iKey">${keys.map(k => `<option${k === guess ? ' selected' : ''}>${esc(k)}</option>`).join('')}<option value="">(numéroter automatiquement)</option></select>
    <label class="f">Ces polygones sont</label>
    <div class="chips" id="iZone"><button data-z="ZE" class="${zdef === 'ZE' ? 'on' : ''}">la zone d'étude (ZE)</button><button data-z="ZEE" class="${zdef === 'ZEE' ? 'on' : ''}">la zone élargie (ZEE)</button>${keys.length ? `<button data-z="champ" class="${zdef === 'champ' ? 'on' : ''}">selon un champ</button>` : ''}</div>
    <div id="iZField" style="display:${zdef === 'champ' ? 'block' : 'none'}"><select id="iZKey">${keys.map(k => `<option${k === zguess ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
      <p class="mut">Valeur contenant « ZEE » ou « élarg » → ZEE, sinon → ZE.</p></div>
    <label class="f">Année / campagne</label><input id="iYear" value="${new Date().getFullYear()}">
    <label class="f"><input type="checkbox" id="iRepl" checked style="width:auto"> Si le site existe déjà : remplacer sa ZE / ZEE (sinon : ajouter les polygones)</label>
    <p class="mut" id="iPrev"></p>
    <button class="btn pri" id="iOk">Importer</button><button class="btn" id="iNo">Annuler</button>`);
  let zmode = zdef;
  const names = () => { const k = $('#iKey', sh).value; return feats.map((f, i) => String((k && f.properties && f.properties[k]) ?? '').trim() || `Site ${i + 1}`); };
  const zones = () => feats.map(f => zmode !== 'champ' ? zmode : (/zee|[ée]larg/i.test(String((f.properties || {})[$('#iZKey', sh).value] ?? '')) ? 'ZEE' : 'ZE'));
  const prev = () => {
    const n = names(), z = zones(), u = [...new Set(n)];
    const ex = u.filter(x => sites.some(s => s.nom.toLowerCase() === x.toLowerCase())).length;
    $('#iPrev', sh).textContent = `${u.length} site(s) : ${u.slice(0, 8).join(', ')}${u.length > 8 ? '…' : ''} — ${z.filter(x => x === 'ZE').length} ZE, ${z.filter(x => x === 'ZEE').length} ZEE${ex ? ` — ${ex} site(s) déjà présent(s)` : ''}`;
  };
  prev(); $('#iKey', sh).onchange = prev; $('#iZKey', sh).onchange = prev;
  $('#iZone', sh).onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; zmode = b.dataset.z; $$('#iZone button', sh).forEach(x => x.classList.toggle('on', x === b)); $('#iZField', sh).style.display = zmode === 'champ' ? 'block' : 'none'; prev(); };
  $('#iNo', sh).onclick = closeSheet;
  $('#iOk', sh).onclick = async () => {
    const nm = names(), zs = zones(), year = $('#iYear', sh).value.trim(), repl = $('#iRepl', sh).checked;
    const groups = new Map();
    feats.forEach((f, i) => {
      const key = nm[i].toLowerCase() + '|' + zs[i];
      if (!groups.has(key)) groups.set(key, { nom: nm[i], zone: zs[i].toLowerCase(), polys: [], props: f.properties || {} });
      groups.get(key).polys.push(...polysOf(f.geometry));
    });
    let nNew = 0, nUpd = 0; const touched = new Set();
    for (const g of groups.values()) {
      let s = sites.find(x => x.nom.toLowerCase() === g.nom.toLowerCase());
      if (!s) { s = { id: uuid(), nom: g.nom, annee: year, ze: null, zee: null, props: g.props, createdAt: nowIso() }; sites.push(s); nNew++; }
      else if (!touched.has(s.id)) nUpd++;
      const replace = repl && !touched.has(s.id + g.zone);
      s[g.zone] = geomOf(replace ? g.polys : [...polysOf(s[g.zone]), ...g.polys]);
      touched.add(s.id); touched.add(s.id + g.zone);
      fixBbox(s); s.offline = null; s.updatedAt = nowIso();
      await dbPut('sites', s);
    }
    closeSheet(); drawSites(); refreshHeader(); checkGpsSite(); askPersist(); fitAll();
    toast(`${nNew} site(s) créé(s)${nUpd ? `, ${nUpd} mis à jour` : ''}`, 4000);
  };
}
function fitAll() {
  const ws = sites.filter(hasGeom); if (!ws.length) return;
  const b = ws.reduce((b, s) => [Math.min(b[0], s.bbox[0]), Math.min(b[1], s.bbox[1]), Math.max(b[2], s.bbox[2]), Math.max(b[3], s.bbox[3])], [180, 90, -180, -90]);
  map.fitBounds([[b[1], b[0]], [b[3], b[2]]], { padding: [30, 30] });
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
  const fl = settings.fondsHorsLigne || ['ortho', 'scan25', 'plan'];
  if (fl.includes('ortho')) add(FONDS.ortho.url(), 12, Math.min(settings.zoomMax, 19));
  if (fl.includes('scan25')) add(FONDS.scan25.url(), 12, 16);
  if (fl.includes('plan')) add(FONDS.plan.url(), 12, 16);
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
  if (!list.length) { toast('Aucun site avec périmètre'); return; }
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
    j.s.offline = { date: today(), n: j.urls.length - jerr }; await dbPut('sites', j.s);
  }
  closeSheet(); askPersist();
  toast(cancel ? 'Téléchargement arrêté' : `Fond hors ligne prêt${err ? ` (${err} tuiles en erreur — relancer plus tard)` : ''}`, 5000);
}

/* ---------- Export QGIS ---------- */
const flat = v => Array.isArray(v) ? v.join(', ') : v ?? '';
const r2 = v => Math.round(v * 100) / 100;
async function photoNames(p) {
  const s = siteById(p.siteId), ph = await photosOf(p.id);
  return ph.map((f, i) => ({ f, name: `${slug(s ? s.nom : 'hors_site')}_${slug(p.data.code || p.type)}_${i + 1}.jpg` }));
}
function baseProps(p) {
  const s = siteById(p.siteId);
  return { site: s ? s.nom : '', annee: s ? s.annee : '', zone: zoneOf(p.lat, p.lon, p.siteId) };
}
function posProps(p) {
  const [x, y] = toL93(p.lon, p.lat);
  return { observateur: p.observateur || '', x_l93: r2(x), y_l93: r2(y), lat: +p.lat.toFixed(7), lon: +p.lon.toFixed(7), precision_m: p.acc ?? '', source_pos: p.source || '', saisi_le: isoLocal(p.createdAt), modifie_le: isoLocal(p.updatedAt) };
}
function dataProps(fields, data) { const o = {}; for (const f of fields) o[f.k] = f.t === 'datetime' ? fmtDate(data[f.k]) : flat(data[f.k]); return o; }
function csvOf(rows) {
  if (!rows.length) return '';
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const cell = v => { v = String(v ?? ''); return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return '﻿' + [keys.join(';'), ...rows.map(r => keys.map(k => cell(r[k])).join(';'))].join('\r\n');
}
const fc = (name, feats) => JSON.stringify({ type: 'FeatureCollection', name, crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }, features: feats }, null, 1);
const ptGeom = p => ({ type: 'Point', coordinates: [+p.lon.toFixed(7), +p.lat.toFixed(7)] });
const forSites = (list, siteIds) => siteIds ? list.filter(x => siteIds.includes(x.siteId)) : list;
const scopeName = siteIds => siteIds && siteIds.length === 1 ? slug((siteById(siteIds[0]) || {}).nom) : 'tous_sites';
async function exportQgis(siteIds) {
  const pts = forSites(points, siteIds), pgs = forSites(polys, siteIds), mts = forSites(meteos, siteIds);
  if (!pts.length && !pgs.length && !mts.length) { toast('Rien à exporter'); return; }
  toast('Préparation de l\'export…');
  const zip = new JSZip();
  for (const [type, T] of Object.entries(TYPES)) {
    const list = pts.filter(p => p.type === type); if (!list.length) continue;
    const feats = [], rows = [], pfeats = [], prows = [];
    for (const p of list) {
      const ph = await photoNames(p);
      ph.forEach(({ f, name }) => zip.file('photos/' + name, f.blob));
      const pr = { ...baseProps(p), ...dataProps(FORMS[type], p.data) };
      if (type === 'station') {
        const lp = lastPassage(p) || {};
        Object.assign(pr, { nb_passages: p.passages.length, dernier_passage: lp.n ?? '', detecteur: lp.detecteur || '', derniere_pose: fmtDate(lp.date_pose), derniere_releve: fmtDate(lp.date_releve), en_place: isPending(p) ? 'oui' : 'non' });
        for (const a of p.passages) {
          const ar = { site: pr.site, annee: pr.annee, zone: pr.zone, code: p.data.code, milieu: p.data.milieu || '', passage: a.n, detecteur: a.detecteur || '', date_pose: fmtDate(a.date_pose), date_releve: fmtDate(a.date_releve), nb_nuits: a.nb_nuits ?? '', remarque_passage: a.remarque || '', ...posProps(p), station_id: p.id, passage_id: a.id };
          prows.push(ar); pfeats.push({ type: 'Feature', properties: ar, geometry: ptGeom(p) });
        }
      }
      Object.assign(pr, posProps(p), { photos: ph.map(x => x.name).join(' | '), id: p.id });
      rows.push(pr); feats.push({ type: 'Feature', properties: pr, geometry: ptGeom(p) });
    }
    zip.file(`${T.fichier}.geojson`, fc(T.fichier, feats));
    zip.file(`${T.fichier}_L93.csv`, csvOf(rows));
    if (pfeats.length) { zip.file('stations_passages.geojson', fc('stations_passages', pfeats)); zip.file('stations_passages_L93.csv', csvOf(prows)); }
  }
  if (pgs.length) {
    zip.file('polygones.geojson', fc('polygones', pgs.map(pg => {
      const s = siteById(pg.siteId);
      return { type: 'Feature', properties: { site: s ? s.nom : '', commentaire: pg.data.commentaire || '', milieu: pg.data.milieu || '', surface_m2: Math.round(areaM2(pg.geom)), observateur: pg.observateur || '', saisi_le: isoLocal(pg.createdAt), id: pg.id }, geometry: pg.geom };
    })));
  }
  if (mts.length) zip.file('meteo.csv', csvOf(mts.sort((a, b) => a.date.localeCompare(b.date)).map(m => ({ site: (siteById(m.siteId) || {}).nom || '', date: m.date, temp_coucher_c: m.temp_coucher, vent: m.vent || '', pluie: m.pluie || '', remarque: m.remarque || '', observateur: m.observateur || '' }))));
  zip.file('LISEZMOI.txt', `Export ${APP} ${VERSION} du ${new Date().toLocaleString('fr-FR')}\r\n\r\n` +
    `*.geojson : couches en WGS84 — glisser dans QGIS. Attributs x_l93 / y_l93 en Lambert-93.\r\n` +
    `stations.geojson : 1 point par station (résumé du dernier passage). stations_passages : 1 ligne par passage.\r\n` +
    `polygones.geojson : polygones commentés (surface en m²). meteo.csv : météo par site et par jour.\r\n` +
    `*_L93.csv : séparateur « ; ». Dans QGIS : Couche > Ajouter une couche de texte délimité, X = x_l93, Y = y_l93, SCR = EPSG:2154.\r\n` +
    `zone : ZE, ZEE, hors zone ou hors site. photos/ : photos nommées site_code_n.jpg.\r\n`);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  deliver(blob, `${APP}_QGIS_${scopeName(siteIds)}_${stamp()}.zip`, 'application/zip');
}

/* ---------- Synchronisation ChiroThèque (paquet d'échange) ---------- */
const siteOut = s => ({ id: s.id, nom: s.nom, annee: s.annee || '', ze: s.ze || null, zee: s.zee || null, props: s.props || {}, createdAt: s.createdAt, updatedAt: s.updatedAt || s.createdAt });
function pointOut(p) {
  const [x, y] = toL93(p.lon, p.lat);
  const o = { id: p.id, type: p.type, siteId: p.siteId, lat: p.lat, lon: p.lon, x_l93: r2(x), y_l93: r2(y), precision_m: p.acc ?? null, source_pos: p.source || '', ...p.data, photoIds: p.photoIds || [], observateur: p.observateur || '', createdAt: p.createdAt, updatedAt: p.updatedAt };
  if (p.type === 'station') o.passages = p.passages;
  return o;
}
const DATA_KEYS = { station: FORMS.station.map(f => f.k), arbre: FORMS.arbre.map(f => f.k), obs: FORMS.obs.map(f => f.k) };
function pointIn(o, type) {
  const data = {}; for (const k of DATA_KEYS[type]) if (o[k] !== undefined) data[k] = o[k];
  const p = { id: o.id, type, siteId: o.siteId || null, lat: +o.lat, lon: +o.lon, acc: o.precision_m ?? null, source: o.source_pos || '', data, photoIds: o.photoIds || [], observateur: o.observateur || '', createdAt: o.createdAt, updatedAt: o.updatedAt };
  if (type === 'station') p.passages = o.passages || [];
  return p;
}
async function exportSync(withPhotos) {
  toast('Préparation du paquet…');
  if (!settings.deviceId) { settings.deviceId = uuid(); saveSettings(); }
  const del = await dbAll('deleted');
  const photos = withPhotos ? await dbAll('photos') : [];
  const data = {
    format: 'chirosync', version: 1, appli: `${APP} ${VERSION}`, appareil: settings.deviceId, observateur: settings.observateur, exporte_le: nowIso(), systeme: 'WGS84 (EPSG:4326), x_l93/y_l93 en Lambert-93 (EPSG:2154)',
    sites: sites.map(siteOut),
    stations: points.filter(p => p.type === 'station').map(pointOut),
    arbres: points.filter(p => p.type === 'arbre').map(pointOut),
    observations: points.filter(p => p.type === 'obs').map(pointOut),
    polygones: polys.map(pg => ({ id: pg.id, siteId: pg.siteId, geom: pg.geom, ...pg.data, surface_m2: Math.round(areaM2(pg.geom)), observateur: pg.observateur || '', createdAt: pg.createdAt, updatedAt: pg.updatedAt })),
    meteo: meteos.map(m => ({ ...m })),
    suppressions: del.map(d => ({ id: d.id, type: d.kind, deletedAt: d.deletedAt })),
    photos: photos.map(p => ({ id: p.id, pointId: p.pointId, fichier: `photos/${p.id}.jpg` })),
  };
  const zip = new JSZip();
  zip.file('donnees.json', JSON.stringify(data, null, 1));
  photos.forEach(p => zip.file(`photos/${p.id}.jpg`, p.blob));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });
  settings.lastSync = { envoi: nowIso() }; saveSettings();
  deliver(blob, `${APP}_${slug(settings.observateur || 'appareil')}_${stamp()}.chirosync.zip`, 'application/zip',
    `${sites.length} site(s), ${points.length} point(s), ${polys.length} polygone(s), ${meteos.length} météo(s)${withPhotos ? `, ${photos.length} photo(s)` : ''}. À déposer dans ChiroThèque (Bluetooth ou câble USB : dossier Téléchargements).`);
}
function syncMenu() {
  const sh = openSheet(`<h2>Synchronisation ChiroThèque</h2>
    <p class="mut">Échange par fichier : le téléphone dépose ses données, et récupère celles de ChiroThèque (sites et périmètres, données des collègues).</p>
    <h3>1. Envoyer</h3>
    <label class="f"><input type="checkbox" id="yPh" checked style="width:auto"> Inclure les photos</label>
    <button class="btn pri" id="ySend">Préparer le paquet à envoyer</button>
    <h3>2. Recevoir</h3>
    <button class="btn" id="yRecv">Importer un paquet ChiroThèque (.chirosync.zip)</button>
    <p class="mut">Le même paquet sert de sauvegarde complète, et à transférer les données vers un autre téléphone.</p>
    <button class="btn" id="yNo">Fermer</button>`);
  $('#ySend', sh).onclick = () => exportSync($('#yPh', sh).checked);
  $('#yRecv', sh).onclick = () => pickFile('.zip,.json,application/zip,application/json', importSync);
  $('#yNo', sh).onclick = closeSheet;
}
async function importSync(file) {
  try {
    let data; const photoBlobs = new Map();
    if (/\.json$/i.test(file.name)) data = JSON.parse(await file.text());
    else {
      const zip = await JSZip.loadAsync(file);
      const main = zip.file('donnees.json'); if (!main) throw new Error('donnees.json absent du paquet');
      data = JSON.parse(await main.async('string'));
      for (const p of data.photos || []) { const f = zip.file(p.fichier); if (f) photoBlobs.set(p.id, await f.async('blob')); }
    }
    await importSyncData(data, photoBlobs);
  } catch (e) { toast('Import impossible : ' + e.message, 6000); }
}
async function importSyncData(data, photoBlobs) {
  if (data.format === 'chiroterrain-sauvegarde') { // sauvegarde de la v1.0
    for (const p of data.photos || []) photoBlobs.set(p.id, await (await fetch(p.data)).blob());
    data = { format: 'chirosync', sites: data.sites, stations: [], arbres: [], observations: [], polygones: [], meteo: [], suppressions: [], photos: (data.photos || []).map(p => ({ id: p.id, pointId: p.pointId })), _v1points: data.points };
  }
  if (data.format !== 'chirosync') throw new Error('format de paquet inconnu');
  const n = { new: 0, upd: 0, del: 0, ph: 0 };
  const newer = (inc, cur) => !cur || String(inc.updatedAt || '') > String(cur.updatedAt || '');
  const deleted = new Map((await dbAll('deleted')).map(d => [d.id, d]));
  const isDeadLocally = o => { const d = deleted.get(o.id); return d && d.deletedAt >= String(o.updatedAt || ''); };
  // Sites
  for (const o of data.sites || []) {
    if (isDeadLocally(o)) continue;
    let cur = await dbGet('sites', o.id);
    if (o.geom && !o.ze) { o.ze = o.geom; delete o.geom; }
    if (newer(o, cur)) { const s = fixBbox({ ...siteOut(o), offline: cur ? cur.offline : null }); await dbPut('sites', s); cur ? n.upd++ : n.new++; }
  }
  // Points
  const incoming = [...(data.stations || []).map(o => pointIn(o, 'station')), ...(data.arbres || []).map(o => pointIn(o, 'arbre')), ...(data.observations || []).map(o => pointIn(o, 'obs')), ...(data._v1points || []).map(p => ({ ...migratePoint(p), photoIds: (data.photos || []).filter(f => f.pointId === p.id).map(f => f.id) }))];
  for (const p of incoming) {
    if (isDeadLocally(p)) continue;
    const cur = await dbGet('points', p.id);
    if (newer(p, cur)) {
      await dbPut('points', p); cur ? n.upd++ : n.new++;
      if (cur) for (const f of await photosOf(p.id)) if (!p.photoIds.includes(f.id) && !photoBlobs.has(f.id)) await dbDel('photos', f.id);
    }
  }
  for (const ph of data.photos || []) {
    const b = photoBlobs.get(ph.id); if (!b || await dbGet('photos', ph.id)) continue;
    await dbPut('photos', { id: ph.id, pointId: ph.pointId, blob: b, ts: Date.now() }); n.ph++;
  }
  // Polygones
  for (const o of data.polygones || []) {
    if (isDeadLocally(o)) continue;
    const cur = await dbGet('polys', o.id);
    if (newer(o, cur)) { await dbPut('polys', { id: o.id, siteId: o.siteId || null, geom: o.geom, data: { commentaire: o.commentaire || '', milieu: o.milieu || '' }, observateur: o.observateur || '', createdAt: o.createdAt, updatedAt: o.updatedAt }); cur ? n.upd++ : n.new++; }
  }
  // Météo
  for (const o of data.meteo || []) {
    if (isDeadLocally(o)) continue;
    const cur = await dbGet('meteo', o.id);
    if (newer(o, cur)) { await dbPut('meteo', o); cur ? n.upd++ : n.new++; }
  }
  // Suppressions faites ailleurs
  const STORE = { site: 'sites', point: 'points', poly: 'polys', meteo: 'meteo' };
  for (const d of data.suppressions || []) {
    const st = STORE[d.type]; if (!st) continue;
    const cur = await dbGet(st, d.id);
    if (cur && String(d.deletedAt) >= String(cur.updatedAt || '')) {
      if (st === 'points') for (const f of await photosOf(d.id)) await dbDel('photos', f.id);
      await dbDel(st, d.id); n.del++;
    }
    if (!deleted.has(d.id)) await dbPut('deleted', { id: d.id, kind: d.type, deletedAt: d.deletedAt });
  }
  settings.lastSync = { ...(settings.lastSync || {}), reception: nowIso() }; saveSettings();
  await loadAll(); closeSheet(); fitAll();
  toast(`Import terminé : ${n.new} nouveau(x), ${n.upd} mis à jour, ${n.del} supprimé(s), ${n.ph} photo(s)`, 6000);
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

/* ---------- Stations à relever ---------- */
function openPending() {
  const list = points.filter(p => p.type === 'station' && isPending(p)).map(p => ({ p, a: lastPassage(p), d: gps ? dist(gps.lat, gps.lon, p.lat, p.lon) : null })).sort((x, y) => (x.d ?? 0) - (y.d ?? 0));
  const sh = openSheet(`<h2>Stations à relever (${list.length})</h2>
    <ul class="list" id="pList">${list.map(({ p, a, d }) => `<li><div class="t" data-go="${p.id}"><b>${esc(p.data.code)} · P${esc(a.n)} — ${esc((siteById(p.siteId) || {}).nom || 'Hors site')}</b><small>posée ${esc(fmtDate(a.date_pose))}${a.nb_nuits ? ` · ${esc(a.nb_nuits)} nuit(s)` : ''}${d != null ? ' · ' + fmtDist(d) : ''}</small></div><button class="btn sm st" data-rel="${p.id}">Relever</button></li>`).join('')}</ul>
    ${list.length ? '' : '<p class="mut">Toutes les stations sont relevées.</p>'}<button class="btn" id="pcClose">Fermer</button>`);
  $('#pList', sh).onclick = async e => {
    const go = e.target.closest('[data-go]'), rel = e.target.closest('[data-rel]');
    if (go) { const p = points.find(x => x.id === go.dataset.go); closeSheet(); map.setView([p.lat, p.lon], 18); showPoint(p.id); }
    if (rel) { const p = points.find(x => x.id === rel.dataset.rel); await releve(p, lastPassage(p).id); openPending(); }
  };
  $('#pcClose', sh).onclick = closeSheet;
}

/* ---------- Menu & réglages ---------- */
$('#btnMenu').onclick = () => {
  const s = activeSite();
  const sh = openSheet(`<h2>${APP}</h2>
    <button class="btn" id="mSites">Sites d'étude</button>
    <button class="btn" id="mPend">Stations à relever</button>
    <button class="btn" id="mMet">Météo du jour</button>
    <h3>Échanges</h3>
    <button class="btn pri" id="mSync">Synchroniser avec ChiroThèque</button>
    ${s ? `<button class="btn" id="mExpS">Exporter « ${esc(s.nom)} » pour QGIS</button>` : ''}
    <button class="btn" id="mExpA">Exporter tous les sites pour QGIS</button>
    <button class="btn" id="mImp">Importer des périmètres (GeoJSON / KML)</button>
    <h3>Appli</h3>
    <button class="btn" id="mSet">Réglages</button>
    <button class="btn" id="mClose">Fermer</button>
    <p class="mut" style="text-align:center">Version ${VERSION} — données stockées sur ce téléphone${settings.lastSync && settings.lastSync.envoi ? `<br>Dernier envoi : ${esc(isoLocal(settings.lastSync.envoi))}` : ''}</p>`);
  $('#mSites', sh).onclick = openSites; $('#mPend', sh).onclick = openPending; $('#mMet', sh).onclick = () => openMeteo();
  $('#mSync', sh).onclick = syncMenu; $('#mImp', sh).onclick = pickImport;
  if (s) $('#mExpS', sh).onclick = () => exportQgis([s.id]);
  $('#mExpA', sh).onclick = () => exportQgis(null);
  $('#mSet', sh).onclick = openSettings; $('#mClose', sh).onclick = closeSheet;
};
async function openSettings() {
  let usage = '';
  try { const e = await navigator.storage.estimate(); usage = `${(e.usage / 1048576).toFixed(0)} Mo utilisés`; } catch (e) { }
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false;
  const sh = openSheet(`<h2>Réglages</h2>
    <label class="f">Observateur (initiales ou nom)</label><input id="sObs" value="${esc(settings.observateur)}">
    <label class="f">Détecteurs (un par ligne)</label><textarea id="sDet" rows="6">${esc(settings.detecteurs.join('\n'))}</textarea>
    <label class="f">Types de gîtes des arbres (un par ligne)</label><textarea id="sGit" rows="7">${esc(settings.gites.join('\n'))}</textarea>
    <label class="f">Fonds à télécharger pour le hors ligne</label>
    <div class="chips" data-k="fhl" data-multi="1">${Object.entries(FONDS).map(([k, f]) => `<button type="button" data-v="${k}" class="${(settings.fondsHorsLigne || []).includes(k) ? 'on' : ''}">${esc(f.nom)}</button>`).join('')}</div>
    <label class="f">Clé IGN pour la Carte IGN (SCAN 25)</label><input id="sCle" value="${esc(settings.cleScan)}" placeholder="vide = clé générique IGN">
    <label class="f">Zoom maximal de la photo aérienne hors ligne</label>
    <select id="sZoom">${[17, 18, 19].map(z => `<option value="${z}"${z === settings.zoomMax ? ' selected' : ''}>${z}${z === 18 ? ' (conseillé)' : z === 19 ? ' (très détaillé, 4× plus lourd)' : ' (léger)'}</option>`).join('')}</select>
    <p class="mut">${usage}${persisted ? ' · stockage protégé' : ' · stockage non protégé (Chrome peut l\'effacer si le téléphone manque de place)'}</p>
    <button class="btn pri" id="sOk">Enregistrer</button>
    <button class="btn" id="sTiles">Vider le cache des fonds de carte</button>
    <button class="btn dan" id="sWipe">Tout effacer (sites, points, photos…)</button>
    <button class="btn" id="sNo">Fermer</button>`);
  const lines = id => $(id, sh).value.split('\n').map(s => s.trim()).filter(Boolean);
  bindFormUi(sh);
  $('#sOk', sh).onclick = () => {
    settings.observateur = $('#sObs', sh).value.trim();
    settings.detecteurs = lines('#sDet'); settings.gites = lines('#sGit');
    settings.zoomMax = +$('#sZoom', sh).value;
    settings.fondsHorsLigne = readFields(sh, [{ k: 'fhl', t: 'multi' }]).fhl;
    const cle = $('#sCle', sh).value.trim();
    if (cle !== settings.cleScan) { settings.cleScan = cle; refreshScanLayer(); }
    saveSettings(); closeSheet(); toast('Réglages enregistrés');
  };
  $('#sTiles', sh).onclick = async () => {
    if (!await confirmSheet('Vider le cache des fonds de carte ? Il faudra les retélécharger pour travailler hors ligne.', 'Vider')) return;
    await caches.delete(TILE_CACHE); for (const s of sites) { s.offline = null; await dbPut('sites', s); } toast('Cache vidé');
  };
  $('#sWipe', sh).onclick = async () => {
    if (!await confirmSheet('Effacer TOUTES les données de ce téléphone (sites, points, polygones, météo, photos) ? Synchronisez avant.', 'Tout effacer')) return;
    for (const st of ['sites', 'points', 'photos', 'polys', 'meteo', 'deleted']) await rq(store(st, 'readwrite').clear());
    settings.activeSiteId = null; saveSettings(); await loadAll(); toast('Données effacées');
  };
  $('#sNo', sh).onclick = closeSheet;
}
let persistAsked = false;
async function askPersist() { if (persistAsked || !navigator.storage || !navigator.storage.persist) return; persistAsked = true; try { await navigator.storage.persist(); } catch (e) { } }

/* ---------- Migration des données de la v1.0 ---------- */
function migratePoint(p) {
  if (p.type === 'station' && !p.passages) {
    const d = p.data || {};
    p.passages = (d.date_pose || d.detecteur) ? [{ id: uuid(), n: 1, detecteur: d.detecteur || '', date_pose: d.date_pose || '', date_releve: d.date_releve || '', nb_nuits: d.nb_nuits ?? '', remarque: '', createdAt: p.createdAt }] : [];
    p.data = { code: d.code || '', milieu: d.milieu || '', remarque: d.remarque || '' };
  }
  if (p.type === 'arbre' && typeof p.data.diametre === 'number') {
    const v = p.data.diametre; p.data.diametre = v < 20 ? 'PBC' : v < 40 ? 'MBC' : v < 60 ? 'GBC' : 'TGBC';
  }
  return p;
}
async function migrate() {
  for (const s of await dbAll('sites')) if (s.geom && !('ze' in s)) { s.ze = s.geom; s.zee = null; delete s.geom; s.updatedAt = s.updatedAt || s.createdAt; fixBbox(s); await dbPut('sites', s); }
  for (const p of await dbAll('points')) {
    const before = JSON.stringify(p); migratePoint(p);
    if (!p.photoIds) p.photoIds = (await photosOf(p.id)).map(f => f.id);
    if (JSON.stringify(p) !== before) await dbPut('points', p);
  }
}

/* ---------- Démarrage ---------- */
async function loadAll() {
  sites = await dbAll('sites'); points = await dbAll('points'); polys = await dbAll('polys'); meteos = await dbAll('meteo');
  sites.forEach(fixBbox);
  drawAll(); checkGpsSite();
}
async function init() {
  try { await idbOpen(); } catch (e) { toast('Stockage local indisponible : ' + e.message, 8000); return; }
  const st = await dbGet('settings', 'settings');
  if (st) settings = { ...settings, ...st.value, last: { station: {}, passage: {}, arbre: {}, obs: {}, ...(st.value.last || {}) } };
  if (!settings.gites || !settings.gites.length) settings.gites = [...GITES_DEFAUT];
  if (!settings.last.passage.detecteur && settings.last.station && settings.last.station.detecteur) settings.last.passage = { detecteur: settings.last.station.detecteur, nb_nuits: settings.last.station.nb_nuits };
  if (!settings.deviceId) settings.deviceId = uuid();
  saveSettings();
  if (!settings.fondsHorsLigne) settings.fondsHorsLigne = ['ortho', 'scan25', 'plan'];
  refreshScanLayer();
  (baseLayers[(FONDS[settings.fond] || FONDS.ortho).nom]).addTo(map);
  await migrate();
  await loadAll();
  const s = activeSite();
  if (s && hasGeom(s)) fitSite(s); else fitAll();
  startGps();
  if (!sites.length && !points.length) {
    const sh = openSheet(`<h2>Bienvenue dans ${APP}</h2>
      <p>1. Récupérez vos sites : depuis ChiroThèque (☰ › Synchroniser) ou en important un GeoJSON / KML exporté de QGIS (ZE et ZEE).</p>
      <p>2. Téléchargez le fond de carte hors ligne de chaque site (Wi-Fi conseillé).</p>
      <p>3. Sur le terrain : <b>Station</b>, <b>Arbre</b>, <b>Obs.</b>, <b>Polygone</b>, et le bouton <b>MÉTÉO</b>.</p>
      <label class="f">Vos initiales (observateur)</label><input id="wObs" value="${esc(settings.observateur)}">
      <button class="btn pri" id="wImp">Importer mes périmètres</button><button class="btn" id="wSync">Recevoir un paquet ChiroThèque</button><button class="btn" id="wLater">Plus tard</button>`);
    const keep = () => { settings.observateur = $('#wObs', sh).value.trim(); saveSettings(); };
    $('#wImp', sh).onclick = () => { keep(); closeSheet(); pickImport(); };
    $('#wSync', sh).onclick = () => { keep(); closeSheet(); pickFile('.zip,.json,application/zip,application/json', importSync); };
    $('#wLater', sh).onclick = () => { keep(); closeSheet(); };
  }
}
init();

/* ---------- Service worker (hors ligne + mises à jour) ---------- */
let updating = false;
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const showUpd = w => { $('#updBar').style.display = 'block'; $('#btnUpd').onclick = () => { updating = true; w.postMessage('skipWaiting'); }; };
    if (reg.waiting) showUpd(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpd(w); }); });
    setInterval(() => reg.update().catch(() => { }), 3600 * 1000);
  }).catch(() => { });
  // Recharge seulement après « Mettre à jour » (pas lors de la toute première installation)
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (updating) { updating = false; location.reload(); } });
}
