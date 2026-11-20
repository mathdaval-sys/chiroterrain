# Format d'échange ChiroTerrain ⇄ ChiroThèque — « chirosync » v2

Ce document sert de cahier des charges pour développer la synchronisation côté ChiroThèque.

## Principe

L'échange se fait **par fichier** : `*.chirosync.zip`, transmis par Bluetooth ou par câble USB.

- **Téléphone → ChiroThèque** : le téléphone envoie *toutes* ses données (sites, stations et passages, arbres, observations, polygones, météo, suppressions, et les photos si on le choisit). ChiroThèque les fusionne dans sa base.
- **ChiroThèque → téléphone** : ChiroThèque produit un paquet au même format, avec les sites et leurs périmètres ZE/ZEE et les données des autres observateurs. Le téléphone le fusionne.
- **Règle de fusion** (identique des deux côtés) :
  - chaque enregistrement a un `id` unique (UUID) et une date `updatedAt` (ISO 8601 UTC) ;
  - on garde la version dont `updatedAt` est la plus récente ;
  - une suppression l'emporte si sa date `deletedAt` est postérieure ou égale à `updatedAt`.
- **Stations : fusion passage par passage** (v2). Les champs de la station viennent de la version la plus récente. Les `passages` sont réunis par `id` : pour un même passage, on garde la version dont `updatedAt` est la plus récente. Un passage listé dans `passagesSupprimes` avec un `deletedAt` postérieur ou égal à son `updatedAt` est retiré. Deux observateurs peuvent donc ajouter chacun un passage à la même station sans rien perdre.
- Le même paquet sert de **sauvegarde complète** et de transfert vers un autre téléphone.

## Contenu du ZIP

```
donnees.json
photos/mini/<id_photo>.jpg   miniature (240 px), toujours présente si elle existe
photos/<id_photo>.jpg        photo en taille réelle (facultative)
```

Les photos en taille réelle ne passent normalement pas par ce paquet. Elles partent sur le serveur photos via l'export « Photos du site » (ZIP rangé par site), puis sont supprimées du téléphone. Seules la miniature et les métadonnées restent.

## `donnees.json`

```jsonc
{
  "format": "chirosync",
  "version": 2,
  "appli": "ChiroTerrain 1.2.0",            // ou "ChiroThèque x.y"
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
    "type_station": "PEP | PEA",                // PEP = écoute passive (S01…), PEA = point d'écoute active (PE-1…)
    "code": "S02", "milieu": "Haie", "remarque": "",
    "passages": [{
      "id": "uuid", "n": 1, "detecteur": "SM4BAT FS",   // PEA : matériel utilisé
      "date_pose": "2026-11-19T21:30",           // heure locale, sans fuseau (PEA : début de l'écoute)
      "date_releve": "2026-11-22T08:10" | "",    // "" = encore en place (PEA : fin de l'écoute)
      "nb_nuits": 3 | "",                         // absent pour les PEA
      "remarque": "", "observateur": "MD", "createdAt": "ISO", "updatedAt": "ISO"
    }],
    "passagesSupprimes": [{ "id": "uuid du passage", "deletedAt": "ISO" }],
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
    "code": "P01", "commentaire": "Jolie hêtraie bien ouverte", "milieu": "", "photoIds": ["uuid"],
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

  "suppressions": [{ "id": "uuid", "type": "site | point | poly | meteo | photo", "deletedAt": "ISO" }],

  "photos": [{
    "id": "uuid",
    "pointId": "uuid du point, du polygone ou du site",
    "kind": "point | poly | site",              // site = photo liée au site seul (dossier « Autres »)
    "passage": 2 | null,                        // n° de passage pour une photo de station
    "legende": "", "ts": 1763600000000,         // date de prise (ms)
    "lat": 43.2005 | null, "lon": 1.0003 | null, "observateur": "MD",
    "exportedAt": "ISO" | null,                 // date de l'export vers le serveur photos
    "chemin_export": "Martres-Tolosane/Stations/S01/Martres-Tolosane_S01_P2_2026-05-12_2.jpg",
    "miniature": "photos/mini/<id>.jpg",
    "fichier": "photos/<id>.jpg"                // seulement si la photo en taille réelle est jointe
  }]
}
```

## À prévoir côté ChiroThèque

1. **Import** d'un paquet :
   - appliquer la fusion passage par passage pour les stations ;
   - fusionner selon la règle ci-dessus ;
   - stocker les photos ;
   - rattacher les stations et leurs passages aux enregistrements audio, par `site` + `code` + `passage`, ou par `detecteur` + dates de pose et de relève.
2. **Export** d'un paquet pour le terrain : au minimum `sites`, avec `ze` et `zee`. Idéalement, tout ce qui concerne les sites en cours, y compris les données des collègues. Les photos sont facultatives : les omettre allège le transfert.
3. **Sites existants** : ChiroThèque n'a aujourd'hui qu'un point par site. Il faudra ajouter les géométries ZE et ZEE, importées depuis QGIS (GeoJSON) ou reçues du téléphone.
4. **Identifiants** : garder les `id` reçus tels quels. Un enregistrement créé dans ChiroThèque reçoit un nouvel UUID.
5. **Dates** : `updatedAt` doit être mis à jour à chaque modification faite dans ChiroThèque, sinon la modification ne sera pas propagée aux téléphones.
