# ChiroTerrain 1.2 — appli web de terrain

Appli Android, installée depuis Chrome, pour :

- afficher les sites de l'année, avec leur **zone d'étude (ZE)** et leur **zone d'étude élargie (ZEE)**, sur fond IGN ;
- pointer les **stations d'enregistrement**, avec leurs **passages** successifs ;
- pointer les **arbres gîtes**, en diamètre codé (PBC / MBC / GBC / TGBC), et les **observations ponctuelles** ;
- dessiner des **polygones commentés** (« jolie hêtraie bien ouverte », « prairie surpâturée »…) ;
- noter la **météo du jour** par site ;
- travailler **hors ligne** ;
- **synchroniser avec ChiroThèque** par fichier, et exporter vers QGIS.

Les données restent sur le téléphone tant qu'on ne les exporte pas.

---

## Nouveautés de la v1.2

- **Points d'écoute active (PEA)** : dans le formulaire d'une station, choisis **PEP** (écoute passive) ou **PEA** (point d'écoute active).
  - Un PEA est codé PE-1, PE-2… et s'affiche en bleu-vert sur la carte.
  - Ses passages se notent avec le matériel, le début et la fin de l'écoute.
- **Photos** :
  - sur les **polygones**, qui ont maintenant un code (P01, P02…) ;
  - sur le **site seul**, avec le bouton rond **PHOTO** de la carte et une légende facultative. On les retrouve dans *Sites › … › Photos du site* ;
  - le **n° de passage** est enregistré avec chaque photo de station.
- **Exporter les photos d'un site** (*☰* ou *Sites › …*) : un ZIP rangé en `Site/Stations/S01/`, `Points d'ecoute/PE-1/`, `Arbres/A01/`, `Polygones/P01 - commentaire/`, `Observations/O01/` et `Autres/`, avec un fichier `photos.csv` récapitulatif.
  - Les photos sont nommées `Site_Code_P2_2026-05-12_1.jpg`.
  - Une case permet de n'exporter **que les nouvelles photos**.
- **Libérer la place** : une fois le ZIP copié sur le PC (dans l'Explorateur, *Couper* depuis *Téléchargements* du téléphone, puis *Coller* sur le serveur), le bouton **Supprimer ces photos du téléphone** les efface.
  - Une miniature et le nom du fichier sur le serveur restent visibles dans les fiches, avec la mention « serveur ».
  - Les photos supprimées ne reviennent jamais sur le téléphone, même après une synchronisation.
- **Synchronisation plus sûre** : si deux personnes ajoutent chacune un passage à la même station, les deux passages sont conservés. Les suppressions de passages et de photos sont aussi transmises.
- **Carte IGN (SCAN 25)**, depuis la v1.1.1, avec la clé générique IGN. La clé Mica se colle dans *Réglages* quand vous l'aurez.

## Mettre à jour

1. Dézippe `ChiroTerrain_v1.2.zip`.
2. Dans Chrome sur le PC, va sur `https://github.com/TON-NOM/chiroterrain/upload`.
3. Glisse **tout le contenu** du dossier `chiroterrain` dans la zone, puis clique sur **Commit changes**. Les anciens fichiers sont remplacés.
4. Attends 2 minutes, puis ouvre l'appli sur le téléphone : le bandeau jaune **« Nouvelle version disponible »** apparaît. Appuie sur **Mettre à jour**.
   - Si le bandeau n'apparaît pas, ferme complètement l'appli (balayer dans les applis récentes) et rouvre-la.
5. Les points saisis en v1.0 sont convertis automatiquement :
   - chaque station devient une station avec un passage 1 ;
   - les diamètres en cm deviennent PBC, MBC, GBC ou TGBC ;
   - les périmètres existants deviennent la ZE.

## Première installation

Voir les étapes déjà suivies : publication du dossier sur GitHub Pages, puis, sur le téléphone, ouverture de l'adresse dans Chrome › ⋮ › **Ajouter à l'écran d'accueil** › **Installer**, en autorisant la position exacte.

## Préparer la saison

1. **Sites** : deux possibilités.
   - **Depuis ChiroThèque**, quand ce sera prêt : *☰ › Synchroniser avec ChiroThèque › Importer un paquet*.
   - **Depuis QGIS** : exporte la ZE et la ZEE en GeoJSON, puis *☰ › Importer des périmètres*. À l'import, indique si les polygones sont la **ZE**, la **ZEE** ou s'il faut les distinguer **selon un champ** : une valeur contenant « ZEE » ou « élarg » donne la ZEE, sinon la ZE. Un fichier dont le nom contient « ZEE » est reconnu tout seul. Les polygones sont rattachés aux sites existants **par leur nom**.
   - On peut aussi **dessiner** un site (*Sites › Créer un site en dessinant sa ZE*), ou dessiner sa ZEE (*Sites › … › Dessiner la ZEE*).
2. **Fonds hors ligne** : *Sites › … › Télécharger le fond hors ligne* (Wi-Fi conseillé). La zone téléchargée couvre la ZEE.
3. **Réglages** :
   - initiales de l'observateur ;
   - liste des **détecteurs** ;
   - liste des **types de gîtes** des arbres : un par ligne, pour en ajouter ou en enlever.

## Sur le terrain

- **Barre du bas** : *+ Station*, *+ Arbre*, *+ Obs.*, *+ Polygone*.
- **Placer un point** : *Ma position GPS*, *Moyenner 15 s* ou *Viser sur la carte*. Avec *Viser sur la carte*, la carte reste où elle est, même si l'on est loin du point.
- **Stations** :
  - **Création** : on saisit le code et le milieu de la station, puis le **passage 1** (détecteur, pose, relève, nombre de nuits, remarque). Le détecteur et le nombre de nuits sont repris de la saisie précédente.
  - **Nouveau passage** : toucher la station › **+ Ajouter un passage**. Le formulaire s'ouvre avec le passage suivant prérempli.
  - **Relève** : bouton **Relever** sur la fiche, ou *☰ › Stations à relever*, triées par distance. Une station dont le dernier passage est relevé passe en gris. L'étiquette affiche le n° du dernier passage (S02 **P2**).
- **Polygone** :
  - toucher la carte pour placer les sommets, ou *+ Ma position GPS* pour en faire le tour à pied ;
  - *Terminer*, puis saisir le commentaire ;
  - la surface est calculée ;
  - toucher le polygone pour le modifier, le redessiner ou le supprimer.
- **Météo** : bouton rond **MÉTÉO**. On saisit une fiche par site et par jour : température au coucher du soleil, vent (nul / faible / modéré / fort), pluie (nulle / faible / modérée / forte). Après la pose d'une station, l'appli rappelle de noter la météo si ce n'est pas encore fait pour la journée.
- Chaque point est classé automatiquement en **ZE**, **ZEE**, *hors zone* ou *hors site*.

## Échanges

- **Synchroniser avec ChiroThèque** (*☰*) :
  - **Envoyer** : prépare un paquet `.chirosync.zip` avec toutes les données, photos comprises si la case est cochée. On le partage ensuite par Bluetooth vers le PC ou on le récupère par USB dans *Téléchargements*.
  - **Recevoir** : importe un paquet venant de ChiroThèque ou d'un collègue. Les données sont fusionnées : la version la plus récente l'emporte, et les suppressions sont propagées.
  - Par défaut, le paquet ne contient que les **miniatures** des photos : les photos en taille réelle passent par *Exporter les photos d'un site*. Coche « Inclure les photos en taille réelle » pour une **sauvegarde complète** ou pour changer de téléphone.
- **Exporter pour QGIS** : un ZIP qui contient :
  - `stations.geojson` (1 point par station) et `stations_passages.geojson` (1 ligne par passage) ;
  - `arbres_gites.geojson`, `observations.geojson` et `polygones.geojson` ;
  - `meteo.csv` ;
  - les mêmes couches en CSV Lambert-93 ;
  - l'attribut `photos` de chaque couche, qui donne le nom des fichiers tels qu'ils apparaissent dans l'export des photos du site.

Le format du paquet de synchronisation est décrit dans `FORMAT_CHIROSYNC.md`. Ce document sert de cahier des charges pour ChiroThèque.

## Limites connues

- La synchronisation ne fonctionne que si ChiroThèque sait lire et produire le format chirosync, ce qui reste à développer dans le projet ChiroThèque. En attendant, deux téléphones peuvent déjà s'échanger leurs paquets.
- Le transfert se fait par fichier (Bluetooth ou USB) : il n'y a pas encore de liaison directe.
- Les périmètres s'importent en GeoJSON ou KML. Pas encore de GeoPackage ni de shapefile.
