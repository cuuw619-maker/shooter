# SHOOTER — Tactical Yard FPS

Браузерный 3D FPS для ПК и телефона. Игра сохраняет P2P-схему через PeerJS/WebRTC, но игровой арт-слой полностью переделан.

## Что изменено
- Готовая игровая карта **Industrial Asset Yard** на основе 25 CC0 GLB-моделей Kenney City Kit Industrial.
- Сохранены точные игровые коллайдеры и спавны из готовой раскладки Industrial Asset Yard; визуальные GLB-объекты и gameplay collision разделены, чтобы движение и трассировка пуль оставались стабильными.
- MP5A5, P226 и M24 загружаются как готовые reloadable GLB-модели с CC0-происхождением, muzzle sockets и раздельными magazine/charging-handle узлами; поверх них работает recoil, AIM, weapon swap и физически разбитая перезарядка.
- Персонаж использует готовую CC0 модель с Idle/Walk/Run/Jump и плавным cross-fade; добавлены airborne-анимация и исправлена ошибка накопления смещения по Y.
- P2P-синхронизация защищена порядковыми номерами пакетов и временными метками.
- Физика улучшена: air-control, ограниченный sprint только вперёд, jump-buffer и coyote-time, плавное ускорение/торможение.

## Внешние ассеты

Основные внешние модели загружаются по HTTPS с публичных GitHub-репозиториев. Для каждой модели есть локальный процедурный fallback, поэтому отсутствие внешнего ресурса не останавливает игру.

- M4 CARBINE: public-domain модель Quaternius.
- USP SIDEARM: public-domain модель Quaternius.
- AWP SNIPER: public-domain модель Quaternius.
- Tactical character: Quaternius Animated Human, CC0, с клипами Idle / Walk / Run / Jump.

Полные источники и ссылки на лицензии находятся в `ASSET_CREDITS.md`.

## Архитектура
shooter/
├── index.html
├── vendor/
│   ├── three.min.js
│   └── GLTFLoader.js
├── game/
│   ├── main.js
│   ├── world.js
│   ├── assets.js
│   ├── player.js
│   ├── physics.js
│   └── weapons.js
├── engine/
│   ├── core.js
│   ├── collision.js
│   ├── character.js
│   ├── fx.js
│   └── audio.js
├── network/
│   ├── room.js
│   └── sync.js
└── ui/
    ├── hud.js
    └── mobile.js

## Управление
ПК: WASD, Shift, мышь, ЛКМ, ПКМ/AIM, Space, 1/2/3, R.
Телефон: левый стик — движение, правый — обзор, FIRE — стрельба, AIM — прицеливание, JUMP — прыжок, 1/2/3 — смена оружия, R — перезарядка.

## Онлайн
Первый игрок создаёт пятизначный код комнаты. Второй вводит тот же код. После соединения состояние игроков и попадания идут через WebRTC DataChannel.

## Запуск
python -m http.server 8000
Открыть http://localhost:8000

Для телефона через интернет нужен HTTPS-хостинг, например GitHub Pages.

## Важное
Старая карта Sendstone и старый Archie GLB больше не используются игрой. Текущая сцена и персонаж создаются из нового игрового слоя, а внешние модели подключаются асинхронно с локальным fallback.

## Лицензия
Код проекта: лицензия не задана.
Внешние ассеты сохраняются с отдельными условиями исходных авторов; для CC0-ассета выше условия указаны явно.

## Asset credits

The game now prefers external 3D models and keeps procedural fallbacks so a failed remote request does not break gameplay.

### Weapons
- M4 / USP / AWP: public-domain models documented in [solcloud/Counter-Strike](https://github.com/solcloud/Counter-Strike/blob/25a292ff1b9d8ac876f6a96fdbbd6712bbbba803/www/resources/model/README.md), credited there to Quaternius.
- Runtime source paths: `www/resources/model/m4.glb`, `usp.glb`, `awp.glb`.

### Character
- Quaternius Animated Human, CC0, loaded from the copy documented by [Glowin/messager](https://github.com/Glowin/messager/blob/e8b1fbbe6afc7874f3a4feac66f02519261b11a3/.omo/evidence/character-glb.txt).
- Runtime source: `public/models/character.glb`.
- The external character uses its skeletal Idle / Walk / Run / Jump clips through Three.js AnimationMixer.

### Map
The NIGHTLINE FACILITY environment is rebuilt in code from modular industrial geometry: hangars, containers, crates, pipes, fences, barrels, a watchtower, animated objective core, dynamic lamps and procedural surface textures. This keeps collision, mobile performance and offline fallback under project control.

External models are optional at runtime. When they are unavailable, the local procedural M4/USP/AWP and tactical character remain active.
