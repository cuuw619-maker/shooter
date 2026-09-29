# NIGHTLINE FACILITY — 3D asset credits

## Runtime external models

### Weapons
- MP5A5, P226 and M24: ready-made reloadable GLB weapon models derived from Quaternius Ultimate Guns Pack.
- Source pack license: CC0 1.0 Universal.
- Runtime source snapshot: https://github.com/AetherRadar/operation-steel-tide/tree/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons
- The source license documents the Quaternius CC0 provenance and the authored reload mechanisms/sockets contained in the runtime GLBs:
  https://github.com/AetherRadar/operation-steel-tide/blob/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/LICENSE.md

### Character
- Quaternius Animated Human, stated as CC0 by the source project:
  https://github.com/Glowin/messager/blob/e8b1fbbe6afc7874f3a4feac66f02519261b11a3/.omo/evidence/character-glb.txt
- Runtime file path in that project: `public/models/character.glb`.

### Environment props
- Ready-made industrial props from **Kenney Factory Kit 3.0**: robot arm, scanner and large factory boxes.
- License: CC0 1.0 Universal.
- Source/license documentation: https://github.com/FrederickPi1969/3d-learn-digital-twins/blob/756ec21e8b910532f311ea8b5726dc3bd621d491/warehouse-sorting-digital-twin/README.md


- Crate stack and decorated barrel: KayKit Dungeon Remastered Pack 1.0 by Kay Lousberg.
- License: CC0 1.0 Universal.
- Source documentation: https://github.com/Apomera/AlloFlow/blob/42188dba9a920270b4a88c039bee8d7f2933e996/assets/glb/README.md
- Runtime files used: `crates_stacked.glb`, `barrel_decorated.glb`.

## Fallback / original work

The NIGHTLINE map geometry, tactical-character fallback, weapon fallback meshes, animation glue, lighting, collision layout and combat effects in this repository are project code and do not depend on the external models being available.


### Ready-made map
- Industrial Asset Yard: 25 GLB models from Kenney City Kit Industrial, CC0. Runtime source snapshot:
  https://github.com/RAPHCVR/Krunker/tree/0ce0423004c117daac9b2b0a6d94d90ff5ffde5a/apps/client/public/assets/maps/kenney-industrial
- The placement/layout and explicit gameplay collider set are based on the ready-made Industrial Asset Yard implementation in RAPHCVR/Krunker:
  https://github.com/RAPHCVR/Krunker/blob/0ce0423004c117daac9b2b0a6d94d90ff5ffde5a/apps/client/src/mapAssets.ts
  https://github.com/RAPHCVR/Krunker/blob/0ce0423004c117daac9b2b0a6d94d90ff5ffde5a/packages/shared/src/constants.ts


## Large Cold-War arena map
- Arena layout/base: adapted from the public-domain CC0 assets and map composition documented by `DFanso/frag-arena`, including Quaternius/Kenney models and ambientCG textures.
- Source repository: https://github.com/DFanso/frag-arena
- Model credits and CC0 documentation: https://github.com/DFanso/frag-arena/blob/master/public/models/CREDITS.md
- Runtime model source directory: https://github.com/DFanso/frag-arena/tree/master/public/models
- Runtime texture source directory: https://github.com/DFanso/frag-arena/tree/master/public/textures
