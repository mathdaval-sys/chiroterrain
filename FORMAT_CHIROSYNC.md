# Format d'échange ChiroTerrain ⇄ ChiroThèque — « chirosync » v1

Ce document sert de cahier des charges pour développer la synchronisation côté ChiroThèque.

## Principe

L'échange se fait **par fichier** : `*.chirosync.zip`, transmis par Bluetooth ou par câble USB.

- **Téléphone → ChiroThèque** : le téléphone envoie *toutes* ses données (sites, stations et passages, arbres, observations, polygones, météo, suppressions, et les photos si on le choisit). ChiroThèque les fusionne dans sa base.
- **ChiroThèque → téléphone** : ChiroThèque produit un paquet au même format, avec les sites et leurs périmètres ZE/ZEE et les données des autres observateurs. Le téléphone le fusionne.
- **Règle de fusion** (identique des deux côtés) :
  - chaque enregistrement a un `id` unique (UUID) et une date `updatedAt` (ISO 8601 UTC) ;
  - on garde la version dont `updatedAt` est la plus récente ;
  - une suppression l'emporte si sa date `deletedAt` est postérieure ou égale à `updatedAt`.
- Le même paquet sert de **sauvegarde complète** et de transfert vers un autre téléphone.

## Contenu du ZIP

```
donnees.json
photos/<id_photo>.jpg      (facultatif)
```

## `donnees.json`

```jsonc
{
  "format": "chirosync",
  "version": 1,
  "appli": "ChiroTerrain 1.1.0",            // ou "ChiroThèque x.y"
  "appareil": "uuid de l'appareil émetteur",
  "observateur": "MD",
  "exporte_le": "2026-11-19T13:38:46.741Z",
  "systeme": "WGS84 (EPSG:4326), x_l93/y_l93 en Lambert-93 (EPSG:2154)",

  "sites": [{
    "id": "uuid", "nom": "Martres-Tolosane", "annee": "2026",
    "ze":  { "type": "Polygon" | "MultiPolygon", "coordinates": [...] } | null,   // WGS84 lon/lat
    "zee": { ... } | null,
    "props": { },                                  // attributs d'origine (libre)
    "createdAt": "ISO", "updatedAt": "ISO"
  }],

  "stations": [{
    "id": "uuid", "type": "station", "siteId": "uuid | null",
    "lat": 43.2005, "lon": 1.0003, "x_l93": 537378.78, "y_l93": 6235535.09,
    "precision_m": 5 | null, "source_pos": "gps | gps moyenné (n pos.) | carte",
    "code": "S02", "milieu": "Haie", "remarque": "",
    "passages": [{
      "id": "uuid", "n": 1, "detecteur": "SM4BAT FS",
      "date_pose": "2026-11-19T21:30",           // heure locale, sans fuseau
      "date_releve": "2026-11-22T08:10" | "",    // "" = encore en place
      "nb_nuits": 3 | "", "remarque": "", "observateur": "MD", "createdAt": "ISO"
    }],
    "photoIds": ["uuid"], "observateur": "MD", "createdAt": "ISO", "updatedAt": "ISO"
  }],

  "arbres": [{
    "id", "type": "arbre", "siteId", "lat", "lon", "x_l93", "y_l93", "precision_m", "source_pos",
    "code": "A01", "essence": "Chêne pédonculé",
    "diametre": "PBC | MBC | GBC | TGBC",        // 0–20 / 20–40 / 40–60 / > 60 cm
    "gites": ["Cavité de pic", "Fissure"],       // liste paramétrable dans l'appli
    "nb_gites": 2 | "", "hauteur_gite": 6 | "",
    "potentialite": "Faible | Modérée | Forte | Gîte avéré | ''",
    "etat": "Vivant | Dépérissant | Mort sur pied | ''", "marque": "Oui | Non | ''", "remarque": "",
    "photoIds", "observateur", "createdAt", "updatedAt"
  }],

  "observations": [{
    "id", "type": "obs", "siteId", "lat", "lon", "x_l93", "y_l93", "precision_m", "source_pos",
    "code": "O01",
    "type_obs": "Bâti favorable | Grotte / cavité | Pont / ouvrage | Individu(s) observé(s) | Gîte avéré | Guano / indices | Cadavre | Autre",
    "espece": "Murin de Daubenton (Myotis daubentonii)", "effectif": 12 | "",
    "potentialite": "...", "remarque": "",
    "photoIds", "observateur", "createdAt", "updatedAt"
  }],

  "polygones": [{
    "id", "siteId", "geom": { "type": "Polygon", "coordinates": [...] },
    "commentaire": "Jolie hêtraie bien ouverte", "milieu": "",
    "surface_m2": 17633,                          // informatif, recalculé à l'import
    "observateur", "createdAt", "updatedAt"
  }],

  "meteo": [{
    "id": "<siteId>|<AAAA-MM-JJ>",               // une fiche par site et par jour
    "siteId", "date": "2026-11-19",
    "temp_coucher": 14.5 | "",                    // °C au coucher du soleil
    "vent": "Nul | Faible | Modéré | Fort | ''", "pluie": "Nulle | Faible | Modérée | Forte | ''",
    "remarque": "", "observateur", "createdAt", "updatedAt"
  }],

  "suppressions": [{ "id": "uuid", "type": "site | point | poly | meteo", "deletedAt": "ISO" }],

  "photos": [{ "id": "uuid", "pointId": "uuid", "fichier": "photos/<id>.jpg" }]
}
```

## À prévoir côté ChiroThèque

1. **Import** d'un paquet :
   - fusionner selon la règle ci-dessus ;
   - stocker les photos ;
   - rattacher les stations et leurs passages aux enregistrements audio, par `site` + `code` + `passage`, ou par `detecteur` + dates de pose et de relève.
2. **Export** d'un paquet pour le terrain : au minimum `sites`, avec `ze` et `zee`. Idéalement, tout ce qui concerne les sites en cours, y compris les données des collègues. Les photos sont facultatives : les omettre allège le transfert.
3. **Sites existants** : ChiroThèque n'a aujourd'hui qu'un point par site. Il faudra ajouter les géométries ZE et ZEE, importées depuis QGIS (GeoJSON) ou reçues du téléphone.
4. **Identifiants** : garder les `id` reçus tels quels. Un enregistrement créé dans ChiroThèque reçoit un nouvel UUID.
5. **Dates** : `updatedAt` doit être mis à jour à chaque modification faite dans ChiroThèque, sinon la modification ne sera pas propagée aux téléphones.
