# Liste des Tables de la Base de Données

*Généré le 04/01/2026 à 21:03:31*

**Nombre total de tables : 69**

---

## Table `activations`

**Nombre d'enregistrements :** 1

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `titre` | VARCHAR | NOT NULL |
| `type` | VARCHAR | - |
| `date_creation` | TIMESTAMP | - |
| `date_cloture` | TIMESTAMP | - |
| `status` | VARCHAR | - |
| `responsable` | VARCHAR | - |
| `redacteur` | VARCHAR | - |
| `structure_implique` | TEXT | - |
| `commune` | VARCHAR | - |
| `secteur` | VARCHAR | - |
| `description_creation_activation` | TEXT | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |
| `code_departement` | VARCHAR(3) | - |
| `code_commune` | VARCHAR(5) | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`code_commune`** → `communes`(`code_insee`)
- **`code_departement`** → `departements`(`code_insee`)

### Index

- **INDEX** `idx_activations_code_commune` sur (`code_commune`)
- **INDEX** `idx_activations_code_departement` sur (`code_departement`)
- **INDEX** `ix_activations_id` sur (`id`)

---

## Table `activites_documents`

**Nombre d'enregistrements :** 268

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `document_id` | INTEGER | - |
| `utilisateur_id` | INTEGER | NOT NULL |
| `action` | VARCHAR | NOT NULL |
| `details` | TEXT | - |
| `ip_address` | VARCHAR | - |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`document_id`** → `documents`(`id`)
- **`utilisateur_id`** → `utilisateurs`(`id`)

### Index

- **INDEX** `ix_activites_documents_created_at` sur (`created_at`)
- **INDEX** `ix_activites_documents_id` sur (`id`)

---

## Table `addr`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `tlid` | BIGINT | - |
| `fromhn` | VARCHAR(12) | - |
| `tohn` | VARCHAR(12) | - |
| `side` | VARCHAR(1) | - |
| `zip` | VARCHAR(5) | - |
| `plus4` | VARCHAR(4) | - |
| `fromtyp` | VARCHAR(1) | - |
| `totyp` | VARCHAR(1) | - |
| `fromarmid` | INTEGER | - |
| `toarmid` | INTEGER | - |
| `arid` | VARCHAR(22) | - |
| `mtfcc` | VARCHAR(5) | - |
| `statefp` | VARCHAR(2) | - |

### Clé Primaire

- **Colonnes :** `gid`

### Index

- **INDEX** `idx_tiger_addr_tlid_statefp` sur (`tlid`, `statefp`)
- **INDEX** `idx_tiger_addr_zip` sur (`zip`)

---

## Table `addrfeat`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `tlid` | BIGINT | - |
| `statefp` | VARCHAR(2) | NOT NULL |
| `aridl` | VARCHAR(22) | - |
| `aridr` | VARCHAR(22) | - |
| `linearid` | VARCHAR(22) | - |
| `fullname` | VARCHAR(100) | - |
| `lfromhn` | VARCHAR(12) | - |
| `ltohn` | VARCHAR(12) | - |
| `rfromhn` | VARCHAR(12) | - |
| `rtohn` | VARCHAR(12) | - |
| `zipl` | VARCHAR(5) | - |
| `zipr` | VARCHAR(5) | - |
| `edge_mtfcc` | VARCHAR(5) | - |
| `parityl` | VARCHAR(1) | - |
| `parityr` | VARCHAR(1) | - |
| `plus4l` | VARCHAR(4) | - |
| `plus4r` | VARCHAR(4) | - |
| `lfromtyp` | VARCHAR(1) | - |
| `ltotyp` | VARCHAR(1) | - |
| `rfromtyp` | VARCHAR(1) | - |
| `rtotyp` | VARCHAR(1) | - |
| `offsetl` | VARCHAR(1) | - |
| `offsetr` | VARCHAR(1) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `gid`

### Index

- **INDEX** `idx_addrfeat_geom_gist` sur (`the_geom`)
- **INDEX** `idx_addrfeat_tlid` sur (`tlid`)
- **INDEX** `idx_addrfeat_zipl` sur (`zipl`)
- **INDEX** `idx_addrfeat_zipr` sur (`zipr`)

---

## Table `affectations_moyens`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `evenement_id` | INTEGER | NOT NULL |
| `moyen_id` | INTEGER | NOT NULL |
| `date_affectation` | TIMESTAMP | DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`evenement_id`** → `evenements`(`id`)
- **`moyen_id`** → `moyens`(`id`)

### Index

- **INDEX** `ix_affectations_moyens_id` sur (`id`)

---

## Table `affectations_personnel`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `evenement_id` | INTEGER | NOT NULL |
| `personnel_id` | INTEGER | NOT NULL |
| `date_affectation` | TIMESTAMP | DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`evenement_id`** → `evenements`(`id`)
- **`personnel_id`** → `personnel`(`id`)

### Index

- **INDEX** `ix_affectations_personnel_id` sur (`id`)

---

## Table `affectations_vehicules`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `evenement_id` | INTEGER | NOT NULL |
| `vehicule_id` | INTEGER | NOT NULL |
| `date_affectation` | TIMESTAMP | DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`evenement_id`** → `evenements`(`id`)
- **`vehicule_id`** → `vehicules`(`id`)

### Index

- **INDEX** `ix_affectations_vehicules_id` sur (`id`)

---

## Table `annuaire_crise`

**Nombre d'enregistrements :** 8

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `prenom` | VARCHAR | NOT NULL |
| `tel_bureau` | VARCHAR | - |
| `tel_portable` | VARCHAR | - |
| `tel_personnel` | VARCHAR | - |
| `structure` | VARCHAR | - |
| `fonction` | VARCHAR | - |
| `mail` | VARCHAR | - |
| `remarques` | TEXT | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_annuaire_crise_id` sur (`id`)

---

## Table `bg`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tractce` | VARCHAR(6) | - |
| `blkgrpce` | VARCHAR(1) | - |
| `bg_id` | VARCHAR(12) | NOT NULL |
| `namelsad` | VARCHAR(13) | - |
| `mtfcc` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | DOUBLE PRECISION | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `bg_id`

---

## Table `communes`

**Nombre d'enregistrements :** 34,836

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_insee` | VARCHAR(5) | NOT NULL |
| `nom` | VARCHAR(255) | NOT NULL |
| `nom_majuscules` | VARCHAR(255) | - |
| `statut` | VARCHAR(100) | - |
| `code_arrondissement` | VARCHAR(1) | - |
| `code_departement` | VARCHAR(3) | NOT NULL |
| `code_region` | VARCHAR(2) | - |
| `siren_epci` | VARCHAR(50) | - |
| `geom` | NULL | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`code_departement`** → `departements`(`code_insee`)

### Index

- **INDEX** `idx_communes_code_departement` sur (`code_departement`)
- **INDEX** `idx_communes_code_insee` sur (`code_insee`)
- **INDEX** `idx_communes_code_region` sur (`code_region`)
- **INDEX** `idx_communes_departement_nom` sur (`code_departement`, `nom`)
- **INDEX** `idx_communes_geom` sur (`geom`)
- **INDEX** `idx_communes_nom` sur (`nom`)
- **INDEX** `ix_communes_code_departement` sur (`code_departement`)
- **UNIQUE** `ix_communes_code_insee` sur (`code_insee`)
- **INDEX** `ix_communes_code_region` sur (`code_region`)
- **INDEX** `ix_communes_id` sur (`id`)
- **INDEX** `ix_communes_nom` sur (`nom`)

---

## Table `county`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `countyns` | VARCHAR(8) | - |
| `cntyidfp` | VARCHAR(5) | NOT NULL |
| `name` | VARCHAR(100) | - |
| `namelsad` | VARCHAR(100) | - |
| `lsad` | VARCHAR(2) | - |
| `classfp` | VARCHAR(2) | - |
| `mtfcc` | VARCHAR(5) | - |
| `csafp` | VARCHAR(3) | - |
| `cbsafp` | VARCHAR(5) | - |
| `metdivfp` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | BIGINT | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `cntyidfp`

### Index

- **INDEX** `idx_tiger_county` sur (`countyfp`)
- **UNIQUE** `uidx_county_gid` sur (`gid`)

---

## Table `county_lookup`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `st_code` | INTEGER | NOT NULL |
| `state` | VARCHAR(2) | - |
| `co_code` | INTEGER | NOT NULL |
| `name` | VARCHAR(90) | - |

### Clé Primaire

- **Colonnes :** `st_code`, `co_code`

### Index

- **INDEX** `county_lookup_name_idx` sur (`None`)
- **INDEX** `county_lookup_state_idx` sur (`state`)

---

## Table `countysub_lookup`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `st_code` | INTEGER | NOT NULL |
| `state` | VARCHAR(2) | - |
| `co_code` | INTEGER | NOT NULL |
| `county` | VARCHAR(90) | - |
| `cs_code` | INTEGER | NOT NULL |
| `name` | VARCHAR(90) | - |

### Clé Primaire

- **Colonnes :** `st_code`, `co_code`, `cs_code`

### Index

- **INDEX** `countysub_lookup_name_idx` sur (`None`)
- **INDEX** `countysub_lookup_state_idx` sur (`state`)

---

## Table `cousub`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `cousubfp` | VARCHAR(5) | - |
| `cousubns` | VARCHAR(8) | - |
| `cosbidfp` | VARCHAR(10) | NOT NULL |
| `name` | VARCHAR(100) | - |
| `namelsad` | VARCHAR(100) | - |
| `lsad` | VARCHAR(2) | - |
| `classfp` | VARCHAR(2) | - |
| `mtfcc` | VARCHAR(5) | - |
| `cnectafp` | VARCHAR(3) | - |
| `nectafp` | VARCHAR(5) | - |
| `nctadvfp` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | NUMERIC(14, 0) | - |
| `awater` | NUMERIC(14, 0) | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `cosbidfp`

### Index

- **INDEX** `tige_cousub_the_geom_gist` sur (`the_geom`)
- **UNIQUE** `uidx_cousub_gid` sur (`gid`)

---

## Table `departements`

**Nombre d'enregistrements :** 96

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_insee` | VARCHAR(3) | NOT NULL |
| `nom` | VARCHAR(255) | NOT NULL |
| `nom_majuscules` | VARCHAR(255) | - |
| `code_region` | VARCHAR(2) | - |
| `geom` | NULL | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `idx_departements_code_insee` sur (`code_insee`)
- **INDEX** `idx_departements_code_region` sur (`code_region`)
- **INDEX** `idx_departements_geom` sur (`geom`)
- **UNIQUE** `ix_departements_code_insee` sur (`code_insee`)
- **INDEX** `ix_departements_code_region` sur (`code_region`)
- **INDEX** `ix_departements_id` sur (`id`)

---

## Table `dfci_100x100`

**Nombre d'enregistrements :** 144

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_dfci` | VARCHAR(50) | NOT NULL |
| `geom` | NULL | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **UNIQUE** `dfci_100x100_code_dfci_key` sur (`code_dfci`)
- **INDEX** `idx_dfci_100x100_code_dfci` sur (`code_dfci`)
- **INDEX** `idx_dfci_100x100_geom` sur (`geom`)

---

## Table `dfci_1km`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_dfci` | VARCHAR(50) | NOT NULL |
| `geom` | NULL | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **UNIQUE** `dfci_1km_code_dfci_key` sur (`code_dfci`)
- **INDEX** `idx_dfci_1km_code_dfci` sur (`code_dfci`)
- **INDEX** `idx_dfci_1km_geom` sur (`geom`)

---

## Table `dfci_20x20`

**Nombre d'enregistrements :** 3,422

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_dfci` | VARCHAR(50) | NOT NULL |
| `geom` | NULL | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **UNIQUE** `dfci_20x20_code_dfci_key` sur (`code_dfci`)
- **INDEX** `idx_dfci_20x20_code_dfci` sur (`code_dfci`)
- **INDEX** `idx_dfci_20x20_geom` sur (`geom`)

---

## Table `dfci_2x2`

**Nombre d'enregistrements :** 339,264

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code_dfci` | VARCHAR(50) | NOT NULL |
| `geom` | NULL | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **UNIQUE** `dfci_2x2_code_dfci_key` sur (`code_dfci`)
- **INDEX** `idx_dfci_2x2_code_dfci` sur (`code_dfci`)
- **INDEX** `idx_dfci_2x2_geom` sur (`geom`)

---

## Table `direction_lookup`

**Nombre d'enregistrements :** 28

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `name` | VARCHAR(20) | NOT NULL |
| `abbrev` | VARCHAR(3) | - |

### Clé Primaire

- **Colonnes :** `name`

### Index

- **INDEX** `direction_lookup_abbrev_idx` sur (`abbrev`)

---

## Table `documents`

**Nombre d'enregistrements :** 10

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `titre` | VARCHAR | NOT NULL |
| `auteur` | VARCHAR | NOT NULL |
| `description` | TEXT | - |
| `isbn` | VARCHAR | - |
| `type_document` | VARCHAR(5) | - |
| `statut` | VARCHAR(9) | - |
| `source` | VARCHAR | - |
| `nom_fichier_original` | VARCHAR | NOT NULL |
| `nom_fichier_stocke` | VARCHAR | NOT NULL |
| `chemin_stockage` | VARCHAR | NOT NULL |
| `mime_type` | VARCHAR | NOT NULL |
| `taille_octets` | INTEGER | NOT NULL |
| `checksum_sha256` | VARCHAR | NOT NULL |
| `date_publication` | TIMESTAMP | - |
| `date_creation_doc` | TIMESTAMP | - |
| `contenu_texte` | TEXT | - |
| `createur_id` | INTEGER | NOT NULL |
| `structure_id` | INTEGER | - |
| `version_courante` | INTEGER | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`createur_id`** → `utilisateurs`(`id`)
- **`structure_id`** → `entites`(`id`)

### Index

- **INDEX** `ix_documents_auteur` sur (`auteur`)
- **UNIQUE** `ix_documents_checksum_sha256` sur (`checksum_sha256`)
- **INDEX** `ix_documents_id` sur (`id`)
- **INDEX** `ix_documents_isbn` sur (`isbn`)
- **INDEX** `ix_documents_titre` sur (`titre`)

---

## Table `edges`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tlid` | BIGINT | - |
| `tfidl` | NUMERIC(10, 0) | - |
| `tfidr` | NUMERIC(10, 0) | - |
| `mtfcc` | VARCHAR(5) | - |
| `fullname` | VARCHAR(100) | - |
| `smid` | VARCHAR(22) | - |
| `lfromadd` | VARCHAR(12) | - |
| `ltoadd` | VARCHAR(12) | - |
| `rfromadd` | VARCHAR(12) | - |
| `rtoadd` | VARCHAR(12) | - |
| `zipl` | VARCHAR(5) | - |
| `zipr` | VARCHAR(5) | - |
| `featcat` | VARCHAR(1) | - |
| `hydroflg` | VARCHAR(1) | - |
| `railflg` | VARCHAR(1) | - |
| `roadflg` | VARCHAR(1) | - |
| `olfflg` | VARCHAR(1) | - |
| `passflg` | VARCHAR(1) | - |
| `divroad` | VARCHAR(1) | - |
| `exttyp` | VARCHAR(1) | - |
| `ttyp` | VARCHAR(1) | - |
| `deckedroad` | VARCHAR(1) | - |
| `artpath` | VARCHAR(1) | - |
| `persist` | VARCHAR(1) | - |
| `gcseflg` | VARCHAR(1) | - |
| `offsetl` | VARCHAR(1) | - |
| `offsetr` | VARCHAR(1) | - |
| `tnidf` | NUMERIC(10, 0) | - |
| `tnidt` | NUMERIC(10, 0) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `gid`

### Index

- **INDEX** `idx_edges_tlid` sur (`tlid`)
- **INDEX** `idx_tiger_edges_countyfp` sur (`countyfp`)
- **INDEX** `idx_tiger_edges_the_geom_gist` sur (`the_geom`)

---

## Table `entites`

**Nombre d'enregistrements :** 14

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_entites_id` sur (`id`)
- **UNIQUE** `ix_entites_nom` sur (`nom`)

---

## Table `evenements`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `titre` | VARCHAR | NOT NULL |
| `description` | TEXT | - |
| `type` | VARCHAR(18) | NOT NULL |
| `date_debut` | TIMESTAMP | NOT NULL |
| `date_fin` | TIMESTAMP | - |
| `localisation` | VARCHAR | - |
| `geom` | NULL | - |
| `createur_id` | INTEGER | NOT NULL |
| `statut` | VARCHAR | - |
| `priorite` | VARCHAR | - |
| `synchronise` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`createur_id`** → `utilisateurs`(`id`)

### Index

- **INDEX** `idx_evenements_geom` sur (`geom`)
- **INDEX** `ix_evenements_id` sur (`id`)

---

## Table `faces`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `tfid` | NUMERIC(10, 0) | - |
| `statefp00` | VARCHAR(2) | - |
| `countyfp00` | VARCHAR(3) | - |
| `tractce00` | VARCHAR(6) | - |
| `blkgrpce00` | VARCHAR(1) | - |
| `blockce00` | VARCHAR(4) | - |
| `cousubfp00` | VARCHAR(5) | - |
| `submcdfp00` | VARCHAR(5) | - |
| `conctyfp00` | VARCHAR(5) | - |
| `placefp00` | VARCHAR(5) | - |
| `aiannhfp00` | VARCHAR(5) | - |
| `aiannhce00` | VARCHAR(4) | - |
| `comptyp00` | VARCHAR(1) | - |
| `trsubfp00` | VARCHAR(5) | - |
| `trsubce00` | VARCHAR(3) | - |
| `anrcfp00` | VARCHAR(5) | - |
| `elsdlea00` | VARCHAR(5) | - |
| `scsdlea00` | VARCHAR(5) | - |
| `unsdlea00` | VARCHAR(5) | - |
| `uace00` | VARCHAR(5) | - |
| `cd108fp` | VARCHAR(2) | - |
| `sldust00` | VARCHAR(3) | - |
| `sldlst00` | VARCHAR(3) | - |
| `vtdst00` | VARCHAR(6) | - |
| `zcta5ce00` | VARCHAR(5) | - |
| `tazce00` | VARCHAR(6) | - |
| `ugace00` | VARCHAR(5) | - |
| `puma5ce00` | VARCHAR(5) | - |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tractce` | VARCHAR(6) | - |
| `blkgrpce` | VARCHAR(1) | - |
| `blockce` | VARCHAR(4) | - |
| `cousubfp` | VARCHAR(5) | - |
| `submcdfp` | VARCHAR(5) | - |
| `conctyfp` | VARCHAR(5) | - |
| `placefp` | VARCHAR(5) | - |
| `aiannhfp` | VARCHAR(5) | - |
| `aiannhce` | VARCHAR(4) | - |
| `comptyp` | VARCHAR(1) | - |
| `trsubfp` | VARCHAR(5) | - |
| `trsubce` | VARCHAR(3) | - |
| `anrcfp` | VARCHAR(5) | - |
| `ttractce` | VARCHAR(6) | - |
| `tblkgpce` | VARCHAR(1) | - |
| `elsdlea` | VARCHAR(5) | - |
| `scsdlea` | VARCHAR(5) | - |
| `unsdlea` | VARCHAR(5) | - |
| `uace` | VARCHAR(5) | - |
| `cd111fp` | VARCHAR(2) | - |
| `sldust` | VARCHAR(3) | - |
| `sldlst` | VARCHAR(3) | - |
| `vtdst` | VARCHAR(6) | - |
| `zcta5ce` | VARCHAR(5) | - |
| `tazce` | VARCHAR(6) | - |
| `ugace` | VARCHAR(5) | - |
| `puma5ce` | VARCHAR(5) | - |
| `csafp` | VARCHAR(3) | - |
| `cbsafp` | VARCHAR(5) | - |
| `metdivfp` | VARCHAR(5) | - |
| `cnectafp` | VARCHAR(3) | - |
| `nectafp` | VARCHAR(5) | - |
| `nctadvfp` | VARCHAR(5) | - |
| `lwflag` | VARCHAR(1) | - |
| `offset` | VARCHAR(1) | - |
| `atotal` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |
| `tractce20` | VARCHAR(6) | - |
| `blkgrpce20` | VARCHAR(1) | - |
| `blockce20` | VARCHAR(4) | - |
| `countyfp20` | VARCHAR(3) | - |
| `statefp20` | VARCHAR(2) | - |

### Clé Primaire

- **Colonnes :** `gid`

### Index

- **INDEX** `idx_tiger_faces_countyfp` sur (`countyfp`)
- **INDEX** `idx_tiger_faces_tfid` sur (`tfid`)
- **INDEX** `tiger_faces_the_geom_gist` sur (`the_geom`)

---

## Table `featnames`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `tlid` | BIGINT | - |
| `fullname` | VARCHAR(100) | - |
| `name` | VARCHAR(100) | - |
| `predirabrv` | VARCHAR(15) | - |
| `pretypabrv` | VARCHAR(50) | - |
| `prequalabr` | VARCHAR(15) | - |
| `sufdirabrv` | VARCHAR(15) | - |
| `suftypabrv` | VARCHAR(50) | - |
| `sufqualabr` | VARCHAR(15) | - |
| `predir` | VARCHAR(2) | - |
| `pretyp` | VARCHAR(3) | - |
| `prequal` | VARCHAR(2) | - |
| `sufdir` | VARCHAR(2) | - |
| `suftyp` | VARCHAR(3) | - |
| `sufqual` | VARCHAR(2) | - |
| `linearid` | VARCHAR(22) | - |
| `mtfcc` | VARCHAR(5) | - |
| `paflag` | VARCHAR(1) | - |
| `statefp` | VARCHAR(2) | - |

### Clé Primaire

- **Colonnes :** `gid`

### Index

- **INDEX** `idx_tiger_featnames_lname` sur (`None`)
- **INDEX** `idx_tiger_featnames_snd_name` sur (`None`)
- **INDEX** `idx_tiger_featnames_tlid_statefp` sur (`tlid`, `statefp`)

---

## Table `fonctions`

**Nombre d'enregistrements :** 9

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_fonctions_id` sur (`id`)
- **UNIQUE** `ix_fonctions_nom` sur (`nom`)

---

## Table `geocode_settings`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `name` | TEXT | NOT NULL |
| `setting` | TEXT | - |
| `unit` | TEXT | - |
| `category` | TEXT | - |
| `short_desc` | TEXT | - |

### Clé Primaire

- **Colonnes :** `name`

---

## Table `geocode_settings_default`

**Nombre d'enregistrements :** 7

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `name` | TEXT | NOT NULL |
| `setting` | TEXT | - |
| `unit` | TEXT | - |
| `category` | TEXT | - |
| `short_desc` | TEXT | - |

### Clé Primaire

- **Colonnes :** `name`

---

## Table `layer`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `topology_id` | INTEGER | NOT NULL |
| `layer_id` | INTEGER | NOT NULL |
| `schema_name` | VARCHAR | NOT NULL |
| `table_name` | VARCHAR | NOT NULL |
| `feature_column` | VARCHAR | NOT NULL |
| `feature_type` | INTEGER | NOT NULL |
| `level` | INTEGER | NOT NULL, DEFAULT 0 |
| `child_id` | INTEGER | - |

### Clé Primaire

- **Colonnes :** `topology_id`, `layer_id`

### Clés Étrangères

- **`topology_id`** → `topology`(`id`)

### Index

- **UNIQUE** `layer_schema_name_table_name_feature_column_key` sur (`schema_name`, `table_name`, `feature_column`)

---

## Table `lieux_accueil`

**Nombre d'enregistrements :** 8

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom_site` | VARCHAR | NOT NULL |
| `commune` | VARCHAR | - |
| `surface` | INTEGER | - |
| `nb_accueil` | INTEGER | - |
| `nb_hebergement` | INTEGER | - |
| `nb_ravitaillement` | INTEGER | - |
| `autres_ressource` | TEXT | - |
| `telephone_responsable` | VARCHAR | - |
| `adresse` | VARCHAR | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_lieux_accueil_id` sur (`id`)

---

## Table `loader_lookuptables`

**Nombre d'enregistrements :** 13

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `process_order` | INTEGER | NOT NULL, DEFAULT 1000 |
| `lookup_name` | TEXT | NOT NULL |
| `table_name` | TEXT | - |
| `single_mode` | BOOLEAN | NOT NULL, DEFAULT true |
| `load` | BOOLEAN | NOT NULL, DEFAULT true |
| `level_county` | BOOLEAN | NOT NULL, DEFAULT false |
| `level_state` | BOOLEAN | NOT NULL, DEFAULT false |
| `level_nation` | BOOLEAN | NOT NULL, DEFAULT false |
| `post_load_process` | TEXT | - |
| `single_geom_mode` | BOOLEAN | DEFAULT false |
| `insert_mode` | CHAR(1) | NOT NULL, DEFAULT 'c'::bpchar |
| `pre_load_process` | TEXT | - |
| `columns_exclude` | ARRAY | - |
| `website_root_override` | TEXT | - |

### Clé Primaire

- **Colonnes :** `lookup_name`

---

## Table `loader_platform`

**Nombre d'enregistrements :** 2

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `os` | VARCHAR(50) | NOT NULL |
| `declare_sect` | TEXT | - |
| `pgbin` | TEXT | - |
| `wget` | TEXT | - |
| `unzip_command` | TEXT | - |
| `psql` | TEXT | - |
| `path_sep` | TEXT | - |
| `loader` | TEXT | - |
| `environ_set_command` | TEXT | - |
| `county_process_command` | TEXT | - |

### Clé Primaire

- **Colonnes :** `os`

---

## Table `loader_variables`

**Nombre d'enregistrements :** 1

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `tiger_year` | VARCHAR(4) | NOT NULL |
| `website_root` | TEXT | - |
| `staging_fold` | TEXT | - |
| `data_schema` | TEXT | - |
| `staging_schema` | TEXT | - |

### Clé Primaire

- **Colonnes :** `tiger_year`

---

## Table `main_courante`

**Nombre d'enregistrements :** 5

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `activation_id` | INTEGER | NOT NULL |
| `utilisateur_id` | INTEGER | NOT NULL |
| `date_heure` | TIMESTAMP | NOT NULL, DEFAULT now() |
| `contenu` | TEXT | NOT NULL |
| `type_entree` | VARCHAR(100) | - |
| `pieces_jointes` | TEXT | - |
| `tags` | TEXT | - |
| `etat` | VARCHAR(50) | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`activation_id`** → `activations`(`id`)
- **`utilisateur_id`** → `utilisateurs`(`id`)

### Index

- **INDEX** `ix_main_courante_id` sur (`id`)

---

## Table `moyens`

**Nombre d'enregistrements :** 20

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `code` | VARCHAR | - |
| `nom` | VARCHAR | NOT NULL |
| `categorie` | VARCHAR | - |
| `nombre` | INTEGER | - |
| `service_utilisateur` | VARCHAR | - |
| `modele` | VARCHAR | - |
| `numero_serie` | VARCHAR | - |
| `date_acquisition` | TIMESTAMP | - |
| `date_garantie` | TIMESTAMP | - |
| `numero_inventaire` | VARCHAR | - |
| `affectation` | VARCHAR | - |
| `stockage` | VARCHAR | - |
| `description` | TEXT | - |
| `structure_id` | INTEGER | - |
| `statut` | VARCHAR(13) | - |
| `etat` | VARCHAR | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`structure_id`** → `entites`(`id`)

### Index

- **UNIQUE** `ix_moyens_code` sur (`code`)
- **INDEX** `ix_moyens_id` sur (`id`)

---

## Table `moyens_main_courante`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `main_courante_id` | INTEGER | NOT NULL |
| `moyen_id` | INTEGER | NOT NULL |
| `date_affectation` | TIMESTAMP | NOT NULL, DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`main_courante_id`** → `main_courante`(`id`)
- **`moyen_id`** → `moyens`(`id`)

### Index

- **INDEX** `idx_moyens_main_courante_main_courante` sur (`main_courante_id`)
- **INDEX** `idx_moyens_main_courante_moyen` sur (`moyen_id`)
- **UNIQUE** `uq_moyens_main_courante` sur (`main_courante_id`, `moyen_id`)

---

## Table `pagc_gaz`

**Nombre d'enregistrements :** 835

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `seq` | INTEGER | - |
| `word` | TEXT | - |
| `stdword` | TEXT | - |
| `token` | INTEGER | - |
| `is_custom` | BOOLEAN | NOT NULL, DEFAULT true |

### Clé Primaire

- **Colonnes :** `id`

---

## Table `pagc_lex`

**Nombre d'enregistrements :** 2,938

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `seq` | INTEGER | - |
| `word` | TEXT | - |
| `stdword` | TEXT | - |
| `token` | INTEGER | - |
| `is_custom` | BOOLEAN | NOT NULL, DEFAULT true |

### Clé Primaire

- **Colonnes :** `id`

---

## Table `pagc_rules`

**Nombre d'enregistrements :** 4,354

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `rule` | TEXT | - |
| `is_custom` | BOOLEAN | DEFAULT true |

### Clé Primaire

- **Colonnes :** `id`

---

## Table `personnel`

**Nombre d'enregistrements :** 20

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `matricule` | VARCHAR | - |
| `nom` | VARCHAR | NOT NULL |
| `prenom` | VARCHAR | NOT NULL |
| `nom_court` | VARCHAR | - |
| `structure_id` | INTEGER | - |
| `fonction` | VARCHAR | - |
| `service` | VARCHAR | - |
| `telephone` | VARCHAR | - |
| `telephone2` | VARCHAR | - |
| `email` | VARCHAR | - |
| `email2` | VARCHAR | - |
| `id_meshtastic` | VARCHAR | - |
| `nom_meshtastic` | VARCHAR | - |
| `nom_court_meshtastic` | VARCHAR | - |
| `commentaire` | TEXT | - |
| `statut` | VARCHAR(14) | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`structure_id`** → `entites`(`id`)

### Index

- **INDEX** `ix_personnel_id` sur (`id`)
- **UNIQUE** `ix_personnel_matricule` sur (`matricule`)

---

## Table `personnel_main_courante`

**Nombre d'enregistrements :** 5

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `main_courante_id` | INTEGER | NOT NULL |
| `personnel_id` | INTEGER | NOT NULL |
| `statut` | VARCHAR(14) | - |
| `date_affectation` | TIMESTAMP | DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`main_courante_id`** → `main_courante`(`id`)
- **`personnel_id`** → `personnel`(`id`)

### Index

- **INDEX** `ix_personnel_main_courante_id` sur (`id`)

---

## Table `place`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `placefp` | VARCHAR(5) | - |
| `placens` | VARCHAR(8) | - |
| `plcidfp` | VARCHAR(7) | NOT NULL |
| `name` | VARCHAR(100) | - |
| `namelsad` | VARCHAR(100) | - |
| `lsad` | VARCHAR(2) | - |
| `classfp` | VARCHAR(2) | - |
| `cpi` | VARCHAR(1) | - |
| `pcicbsa` | VARCHAR(1) | - |
| `pcinecta` | VARCHAR(1) | - |
| `mtfcc` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | BIGINT | - |
| `awater` | BIGINT | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `plcidfp`

### Index

- **INDEX** `tiger_place_the_geom_gist` sur (`the_geom`)
- **UNIQUE** `uidx_tiger_place_gid` sur (`gid`)

---

## Table `place_lookup`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `st_code` | INTEGER | NOT NULL |
| `state` | VARCHAR(2) | - |
| `pl_code` | INTEGER | NOT NULL |
| `name` | VARCHAR(90) | - |

### Clé Primaire

- **Colonnes :** `st_code`, `pl_code`

### Index

- **INDEX** `place_lookup_name_idx` sur (`None`)
- **INDEX** `place_lookup_state_idx` sur (`state`)

---

## Table `risques`

**Nombre d'enregistrements :** 20

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_risques_id` sur (`id`)
- **UNIQUE** `ix_risques_nom` sur (`nom`)

---

## Table `secondary_unit_lookup`

**Nombre d'enregistrements :** 39

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `name` | VARCHAR(20) | NOT NULL |
| `abbrev` | VARCHAR(5) | - |

### Clé Primaire

- **Colonnes :** `name`

### Index

- **INDEX** `secondary_unit_lookup_abbrev_idx` sur (`abbrev`)

---

## Table `services`

**Nombre d'enregistrements :** 7

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_services_id` sur (`id`)
- **UNIQUE** `ix_services_nom` sur (`nom`)

---

## Table `sites_industriels`

**Nombre d'enregistrements :** 20

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom` | VARCHAR | NOT NULL |
| `nom_entreprise` | VARCHAR | - |
| `secteur_activite` | VARCHAR | - |
| `nom_dirigeant` | VARCHAR | - |
| `tel_dirigeant` | VARCHAR | - |
| `tel_std` | VARCHAR | - |
| `adresse_postale` | VARCHAR | - |
| `num_rue` | VARCHAR | - |
| `nom_rue` | VARCHAR | - |
| `code_postal` | VARCHAR | - |
| `ville` | VARCHAR | - |
| `latitude` | VARCHAR | - |
| `longitude` | VARCHAR | - |
| `geom` | NULL | - |
| `surface` | VARCHAR | - |
| `nb_batiment` | VARCHAR | - |
| `risques` | TEXT | - |
| `ppi` | BOOLEAN | - |
| `chemin_acces_ppi` | VARCHAR | - |
| `status_ppi` | VARCHAR | - |
| `capacite_production` | VARCHAR | - |
| `effectif` | INTEGER | - |
| `observations` | TEXT | - |
| `telephone_fixe` | VARCHAR | - |
| `telephone_portable` | VARCHAR | - |
| `telephone_astreinte` | VARCHAR | - |
| `fax` | VARCHAR | - |
| `email` | VARCHAR | - |
| `commentaire` | TEXT | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `idx_sites_industriels_geom` sur (`geom`)
- **INDEX** `ix_sites_industriels_id` sur (`id`)
- **INDEX** `ix_sites_industriels_nom` sur (`nom`)

---

## Table `spatial_ref_sys`

**Nombre d'enregistrements :** 8,500

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `srid` | INTEGER | NOT NULL |
| `auth_name` | VARCHAR(256) | - |
| `auth_srid` | INTEGER | - |
| `srtext` | VARCHAR(2048) | - |
| `proj4text` | VARCHAR(2048) | - |

### Clé Primaire

- **Colonnes :** `srid`

---

## Table `state`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `region` | VARCHAR(2) | - |
| `division` | VARCHAR(2) | - |
| `statefp` | VARCHAR(2) | NOT NULL |
| `statens` | VARCHAR(8) | - |
| `stusps` | VARCHAR(2) | NOT NULL |
| `name` | VARCHAR(100) | - |
| `lsad` | VARCHAR(2) | - |
| `mtfcc` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | BIGINT | - |
| `awater` | BIGINT | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `statefp`

### Index

- **INDEX** `idx_tiger_state_the_geom_gist` sur (`the_geom`)
- **UNIQUE** `uidx_tiger_state_gid` sur (`gid`)
- **UNIQUE** `uidx_tiger_state_stusps` sur (`stusps`)

---

## Table `state_lookup`

**Nombre d'enregistrements :** 59

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `st_code` | INTEGER | NOT NULL |
| `name` | VARCHAR(40) | - |
| `abbrev` | VARCHAR(3) | - |
| `statefp` | CHAR(2) | - |

### Clé Primaire

- **Colonnes :** `st_code`

### Index

- **UNIQUE** `state_lookup_abbrev_key` sur (`abbrev`)
- **UNIQUE** `state_lookup_name_key` sur (`name`)
- **UNIQUE** `state_lookup_statefp_key` sur (`statefp`)

---

## Table `street_type_lookup`

**Nombre d'enregistrements :** 609

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `name` | VARCHAR(50) | NOT NULL |
| `abbrev` | VARCHAR(50) | - |
| `is_hw` | BOOLEAN | NOT NULL, DEFAULT false |

### Clé Primaire

- **Colonnes :** `name`

### Index

- **INDEX** `street_type_lookup_abbrev_idx` sur (`abbrev`)

---

## Table `structures`

**Nombre d'enregistrements :** 1

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `nom_structure` | VARCHAR | NOT NULL |
| `type` | VARCHAR | - |
| `aasc` | BOOLEAN | - |
| `num_rue` | VARCHAR | - |
| `nom_rue` | VARCHAR | - |
| `code_postal` | VARCHAR | - |
| `ville` | VARCHAR | - |
| `responsable` | VARCHAR | - |
| `telephone_fixe` | VARCHAR | - |
| `telephone_portable` | VARCHAR | - |
| `telephone_astreinte` | VARCHAR | - |
| `fax` | VARCHAR | - |
| `email` | VARCHAR | - |
| `remarque` | TEXT | - |
| `logo_banniere` | VARCHAR | - |
| `logo_impression` | VARCHAR | - |
| `logo_general` | VARCHAR | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **INDEX** `ix_structures_id` sur (`id`)

---

## Table `tabblock`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tractce` | VARCHAR(6) | - |
| `blockce` | VARCHAR(4) | - |
| `tabblock_id` | VARCHAR(16) | NOT NULL |
| `name` | VARCHAR(20) | - |
| `mtfcc` | VARCHAR(5) | - |
| `ur` | VARCHAR(1) | - |
| `uace` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | DOUBLE PRECISION | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `tabblock_id`

---

## Table `tabblock20`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tractce` | VARCHAR(6) | - |
| `blockce` | VARCHAR(4) | - |
| `geoid` | VARCHAR(15) | NOT NULL |
| `name` | VARCHAR(10) | - |
| `mtfcc` | VARCHAR(5) | - |
| `ur` | VARCHAR(1) | - |
| `uace` | VARCHAR(5) | - |
| `uatype` | VARCHAR(1) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | DOUBLE PRECISION | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |
| `housing` | DOUBLE PRECISION | - |
| `pop` | DOUBLE PRECISION | - |

### Clé Primaire

- **Colonnes :** `geoid`

---

## Table `tags_documents`

**Nombre d'enregistrements :** 48

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `document_id` | INTEGER | NOT NULL |
| `tag` | VARCHAR | NOT NULL |
| `est_controle` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`document_id`** → `documents`(`id`)

### Index

- **INDEX** `ix_tags_documents_id` sur (`id`)
- **INDEX** `ix_tags_documents_tag` sur (`tag`)

---

## Table `taxonomie_documents`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `document_id` | INTEGER | NOT NULL |
| `categorie` | VARCHAR | NOT NULL |
| `valeur` | VARCHAR | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`document_id`** → `documents`(`id`)

### Index

- **INDEX** `ix_taxonomie_documents_categorie` sur (`categorie`)
- **INDEX** `ix_taxonomie_documents_id` sur (`id`)
- **INDEX** `ix_taxonomie_documents_valeur` sur (`valeur`)

---

## Table `topology`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `name` | VARCHAR | NOT NULL |
| `srid` | INTEGER | NOT NULL |
| `precision` | DOUBLE PRECISION | NOT NULL |
| `hasz` | BOOLEAN | NOT NULL, DEFAULT false |

### Clé Primaire

- **Colonnes :** `id`

### Index

- **UNIQUE** `topology_name_key` sur (`name`)

---

## Table `tract`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | - |
| `countyfp` | VARCHAR(3) | - |
| `tractce` | VARCHAR(6) | - |
| `tract_id` | VARCHAR(11) | NOT NULL |
| `name` | VARCHAR(7) | - |
| `namelsad` | VARCHAR(20) | - |
| `mtfcc` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | DOUBLE PRECISION | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `tract_id`

---

## Table `utilisateurs`

**Nombre d'enregistrements :** 25

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `email` | VARCHAR | NOT NULL |
| `username` | VARCHAR | NOT NULL |
| `hashed_password` | VARCHAR | NOT NULL |
| `nom` | VARCHAR | - |
| `prenom` | VARCHAR | - |
| `structure_id` | INTEGER | - |
| `role` | VARCHAR(11) | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`structure_id`** → `entites`(`id`)

### Index

- **UNIQUE** `ix_utilisateurs_email` sur (`email`)
- **INDEX** `ix_utilisateurs_id` sur (`id`)
- **UNIQUE** `ix_utilisateurs_username` sur (`username`)

---

## Table `vehicules`

**Nombre d'enregistrements :** 20

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `immatriculation` | VARCHAR | - |
| `type_vehicule` | VARCHAR | - |
| `marque` | VARCHAR | - |
| `modele` | VARCHAR | - |
| `annee` | INTEGER | - |
| `structure_id` | INTEGER | - |
| `service_affectation` | VARCHAR | - |
| `km_acquisition` | INTEGER | - |
| `km_actuel` | INTEGER | - |
| `km_revision` | INTEGER | - |
| `prochain_ct` | TIMESTAMP | - |
| `prochaine_revision` | TIMESTAMP | - |
| `numero_inventaire` | VARCHAR | - |
| `commentaire` | TEXT | - |
| `capacite` | INTEGER | - |
| `localisation` | VARCHAR | - |
| `statut` | VARCHAR(14) | - |
| `etat` | VARCHAR | - |
| `actif` | BOOLEAN | - |
| `created_at` | TIMESTAMP | DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`structure_id`** → `entites`(`id`)

### Index

- **INDEX** `ix_vehicules_id` sur (`id`)
- **UNIQUE** `ix_vehicules_immatriculation` sur (`immatriculation`)

---

## Table `vehicules_main_courante`

**Nombre d'enregistrements :** 3

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `main_courante_id` | INTEGER | NOT NULL |
| `vehicule_id` | INTEGER | NOT NULL |
| `date_affectation` | TIMESTAMP | NOT NULL, DEFAULT now() |
| `date_liberation` | TIMESTAMP | - |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMP | - |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`main_courante_id`** → `main_courante`(`id`)
- **`vehicule_id`** → `vehicules`(`id`)

### Index

- **INDEX** `idx_vehicules_main_courante_main_courante` sur (`main_courante_id`)
- **INDEX** `idx_vehicules_main_courante_vehicule` sur (`vehicule_id`)
- **UNIQUE** `uq_vehicules_main_courante` sur (`main_courante_id`, `vehicule_id`)

---

## Table `versions_documents`

**Nombre d'enregistrements :** 10

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `id` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `document_id` | INTEGER | NOT NULL |
| `numero_version` | INTEGER | NOT NULL |
| `nom_fichier_stocke` | VARCHAR | NOT NULL |
| `chemin_stockage` | VARCHAR | NOT NULL |
| `checksum_sha256` | VARCHAR | NOT NULL |
| `taille_octets` | INTEGER | NOT NULL |
| `commentaire_version` | TEXT | - |
| `createur_version_id` | INTEGER | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT now() |

### Clé Primaire

- **Colonnes :** `id`

### Clés Étrangères

- **`createur_version_id`** → `utilisateurs`(`id`)
- **`document_id`** → `documents`(`id`)

### Index

- **INDEX** `ix_versions_documents_checksum_sha256` sur (`checksum_sha256`)
- **INDEX** `ix_versions_documents_id` sur (`id`)

---

## Table `zcta5`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `gid` | INTEGER | NOT NULL, AUTO_INCREMENT |
| `statefp` | VARCHAR(2) | NOT NULL |
| `zcta5ce` | VARCHAR(5) | NOT NULL |
| `classfp` | VARCHAR(2) | - |
| `mtfcc` | VARCHAR(5) | - |
| `funcstat` | VARCHAR(1) | - |
| `aland` | DOUBLE PRECISION | - |
| `awater` | DOUBLE PRECISION | - |
| `intptlat` | VARCHAR(11) | - |
| `intptlon` | VARCHAR(12) | - |
| `partflg` | VARCHAR(1) | - |
| `the_geom` | NULL | - |

### Clé Primaire

- **Colonnes :** `zcta5ce`, `statefp`

### Index

- **UNIQUE** `uidx_tiger_zcta5_gid` sur (`gid`)

---

## Table `zip_lookup`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `zip` | INTEGER | NOT NULL |
| `st_code` | INTEGER | - |
| `state` | VARCHAR(2) | - |
| `co_code` | INTEGER | - |
| `county` | VARCHAR(90) | - |
| `cs_code` | INTEGER | - |
| `cousub` | VARCHAR(90) | - |
| `pl_code` | INTEGER | - |
| `place` | VARCHAR(90) | - |
| `cnt` | INTEGER | - |

### Clé Primaire

- **Colonnes :** `zip`

---

## Table `zip_lookup_all`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `zip` | INTEGER | - |
| `st_code` | INTEGER | - |
| `state` | VARCHAR(2) | - |
| `co_code` | INTEGER | - |
| `county` | VARCHAR(90) | - |
| `cs_code` | INTEGER | - |
| `cousub` | VARCHAR(90) | - |
| `pl_code` | INTEGER | - |
| `place` | VARCHAR(90) | - |
| `cnt` | INTEGER | - |

---

## Table `zip_lookup_base`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `zip` | VARCHAR(5) | NOT NULL |
| `state` | VARCHAR(40) | - |
| `county` | VARCHAR(90) | - |
| `city` | VARCHAR(90) | - |
| `statefp` | VARCHAR(2) | - |

### Clé Primaire

- **Colonnes :** `zip`

---

## Table `zip_state`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `zip` | VARCHAR(5) | NOT NULL |
| `stusps` | VARCHAR(2) | NOT NULL |
| `statefp` | VARCHAR(2) | - |

### Clé Primaire

- **Colonnes :** `zip`, `stusps`

---

## Table `zip_state_loc`

**Nombre d'enregistrements :** 0

### Colonnes

| Nom | Type | Contraintes |
|-----|------|------------|
| `zip` | VARCHAR(5) | NOT NULL |
| `stusps` | VARCHAR(2) | NOT NULL |
| `statefp` | VARCHAR(2) | - |
| `place` | VARCHAR(100) | NOT NULL |

### Clé Primaire

- **Colonnes :** `zip`, `stusps`, `place`

---
