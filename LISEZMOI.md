# ChiroTerrain 1.0 — appli web de terrain

Appli Android (installable depuis Chrome) pour :

- afficher les périmètres de tous les sites de l'année sur fond IGN (photo aérienne, plan, cadastre) ;
- pointer à la pose les **stations d'enregistrement**, les **arbres gîtes potentiels** et les **observations ponctuelles** (bâti, grotte, pont, individus, guano…) ;
- travailler **hors ligne** (appli + fonds de carte téléchargés à l'avance) ;
- exporter vers **QGIS** (GeoJSON + CSV Lambert-93 + photos) et vers **ChiroThèque** (fichier d'échange des stations).

Les données restent **uniquement sur le téléphone** (stockage interne de Chrome). Rien n'est envoyé sur internet, sauf les fonds de carte IGN qui sont téléchargés.

---

## 1. Mettre l'appli en ligne (une seule fois)

Une appli web installable doit être servie en **HTTPS**. C'est aussi ce qui permet à Chrome d'accéder au GPS. Le serveur ne fait que distribuer le code : il ne voit aucune donnée de terrain.

Options gratuites, au choix :

- **GitHub Pages** : créer un dépôt, y déposer le contenu du dossier `chiroterrain`, puis activer *Settings › Pages*. Adresse obtenue : `https://<compte>.github.io/<depot>/`.
- **Netlify** : avec un compte gratuit, glisser le dossier `chiroterrain` sur app.netlify.com/drop.
- **Serveur de Mica** : n'importe quel hébergement web en HTTPS, en copiant simplement le dossier.

## 2. Installer sur le téléphone

1. Ouvrir l'adresse dans **Chrome** sur Android.
2. Menu ⋮ › **Ajouter à l'écran d'accueil** › **Installer**.
3. Ouvrir l'appli depuis son icône et **autoriser la localisation**.

Mises à jour : quand une nouvelle version est déposée sur le serveur, un bandeau « Nouvelle version disponible » apparaît dans l'appli. Les données sont conservées.

## 3. Préparer la saison (au bureau, en Wi-Fi)

1. Dans QGIS, exporter les périmètres de l'année dans **un seul fichier GeoJSON** (clic droit › Exporter › Sauvegarder les entités sous… › GeoJSON). Le KML fonctionne aussi. L'appli accepte le Lambert-93 et le WGS84 et convertit automatiquement.
2. Envoyer le fichier sur le téléphone (Drive, mail, câble USB).
3. Dans l'appli : **☰ › Importer des périmètres** :
   - choisir le champ qui contient le nom du site ;
   - par défaut, les polygones qui portent le même nom sont fusionnés en un seul site ;
   - si un site existe déjà avec le même nom, il est remplacé par la nouvelle version (l'option se décoche à l'import).
4. Pour chaque site, ou pour tous d'un coup : **Sites › … › Télécharger le fond hors ligne**. Les fonds sont téléchargés jusqu'au zoom 18, 300 m autour du périmètre. Compter environ 5 à 10 Mo par site.
5. Dans **Réglages**, saisir ses initiales et sa liste de détecteurs.

## 4. Sur le terrain

- **Site actif** : il est choisi automatiquement dès que le GPS est à l'intérieur d'un périmètre. On peut aussi le choisir dans la liste des sites, triée par distance.
- **+ Station / + Arbre / + Observation** : trois façons de placer le point :
  - **Ma position GPS** ;
  - **Moyenner 15 s** : à utiliser sous couvert forestier ;
  - **Viser sur la carte** : pour un arbre vu à distance, par exemple.
- Les codes se numérotent seuls par site : S01, S02… pour les stations, A01… pour les arbres, O01… pour les observations. Le détecteur, la hauteur du micro, le nombre de nuits et le milieu sont repris de la station précédente.
- **Photos** : prises directement avec l'appareil photo, puis réduites à 1600 px.
- **Relève** : *☰ › Stations à relever* liste les stations encore posées, de la plus proche à la plus éloignée. Le bouton **Relever** enregistre la date et l'heure, et la station passe en gris sur la carte. **Itinéraire** ouvre la navigation vers le point.
- Toucher un point ouvre sa fiche, d'où l'on peut le modifier, le déplacer ou le supprimer.

## 5. Récupérer les données

- **Vers QGIS** : *☰ › Exporter*, pour le site actif ou pour tout. Le ZIP contient :
  - `stations.geojson`, `arbres_gites.geojson`, `observations.geojson` en WGS84, avec les attributs `x_l93` / `y_l93` ;
  - les mêmes données en CSV avec séparateur `;` (fichiers `*_L93.csv`) ;
  - un dossier `photos/` (fichiers nommés `site_code_n.jpg`) ;
  - `stations.chirotheque.json`.
- **Vers ChiroThèque** : *☰ › Envoyer les stations vers ChiroThèque*, puis :
  - **Partager › Bluetooth** vers le PC ;
  - ou **Enregistrer** : le fichier va dans *Téléchargements*, où on le récupère en branchant le téléphone en USB.
- **Sauvegarde complète** (sites, points et photos) : à faire régulièrement. Elle sert aussi à changer de téléphone, avec *Restaurer*.

> Attention : désinstaller l'appli ou effacer les données de Chrome supprime les points. Exportez ou sauvegardez avant.

---

## Format d'échange ChiroThèque (`*.chirotheque.json`)

```json
{
  "format": "chiroterrain-stations",
  "version": 1,
  "exporte_le": "2026-11-18T20:47:13.587Z",
  "appli": "ChiroTerrain 1.0.0",
  "systeme": "WGS84 (EPSG:4326) + Lambert-93 (EPSG:2154)",
  "stations": [
    {
      "id": "2e41e6b0-…",          // identifiant unique et stable : sert de clé de mise à jour
      "code": "S01",
      "site": "Martres-Tolosane",
      "annee": "2026",
      "lat": 43.2005, "lon": 1.0003,
      "x_l93": 537378.78, "y_l93": 6235535.09,
      "precision_m": 6,             // null si placé sur la carte
      "detecteur": "SM4BAT FS",
      "num_serie": "S4U12345",
      "date_pose": "2026-11-18 21:47",     // heure locale du téléphone
      "date_releve": null,                 // ou "AAAA-MM-JJ HH:MM"
      "hauteur_micro_m": 3,
      "milieu": "Lisière",
      "orientation": "SE",
      "nb_nuits": 3,
      "remarque": "",
      "observateur": "MD"
    }
  ]
}
```

Côté ChiroThèque, il suffit d'importer ce fichier. Le rapprochement avec les enregistrements peut se faire par `site` + `code`, ou par `num_serie` + dates de pose et de relève. Réimporter un fichier plus récent met à jour les stations qui ont le même `id`.

## Limites connues (v1)

- Les fonds hors ligne utilisent la Géoplateforme IGN, en accès libre sans clé. Si le téléchargement signale beaucoup d'erreurs, relancer plus tard.
- Les périmètres s'importent en GeoJSON ou KML. Pas encore de GeoPackage ni de shapefile.
- Pas de synchronisation entre plusieurs téléphones : chacun exporte ses données.
- Le Bluetooth passe par le partage Android (envoi de fichier). Une connexion directe en temps réel à ChiroThèque demandera une appli native, à envisager en v2.
