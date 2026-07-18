#!/bin/bash
# Blip Guides — деплой одной командой.
# Использование:  bash ~/Documents/gta6/deploy.sh "что изменил"
# Токен берётся из .git/config (его настроил Олег через git remote add). Здесь токена нет.

cd "$(dirname "$0")" || exit 1

# снять зависший замок, если Claude оставил после подготовки файлов
rm -f .git/index.lock 2>/dev/null
# подчистить временные объекты, которые песочница не смогла удалить
find .git/objects -name 'tmp_obj_*' -delete 2>/dev/null

MSG="${1:-update site}"

git add .            # .gitignore исключает CONTEXT-GTA6.md — секреты не попадут
git commit -m "$MSG"
git push origin main

echo ""
echo "✅ Готово. Через 1–2 мин обнови сайт жёстко: Cmd+Shift+R"
