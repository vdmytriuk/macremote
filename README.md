# MacRemote — сайт

Маркетинговий сайт MacRemote: https://vdmytriuk.github.io/macremote/ (англійська) і
https://vdmytriuk.github.io/macremote/uk/ (українська).

Сторінки збираються з шаблону `src/template.html` і словників `i18n/*.json`:

    node build.mjs

Результат (`index.html`, `uk/index.html`) комітиться в репозиторій, GitHub Pages віддає його як є.
Встановлення додатка лише через `install.sh` (curl не ставить карантин, тому macOS не показує
попереджень). DMG у Releases потрібен саме скрипту; посилань на нього на сайті немає навмисно.
Код застосунку в цьому репозиторії не зберігається.
