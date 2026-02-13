# Valentine Static Mockup

This project is a static webpage under `src/` (`src/index.html`, `src/styles.css`, `src/app.js`, `src/slideController.js`, `src/shows/*.js`, `src/assets/*.gif`) with two run modes.

## Local dev

```bash
docker compose up -d
```

Open `http://localhost:5173`.

Stop:

```bash
docker compose down
```

Show selection via query param:
- `http://localhost:5173/?show=<show_file_name>`
- Example: `http://localhost:5173/?show=birthday` loads `src/shows/birthday.js`
- If `show` is missing or invalid, it falls back to `src/shows/default.js`
- If `default.js` is missing, fallback-of-fallback is `src/shows/no_show.js`

## Install on Linux host (nginx + apt)

```bash
./bin/install
```

What it does:
- installs/updates `nginx` + `apache2-utils` + `nodejs`
- runs `pnpm install`
- runs `pnpm run build`
- copies `dist/` to `/var/www/valentine/dist`
- runs `./bin/update_nginx`

Notes:
- `./bin/install` does not configure auth.
- Configure/replace auth manually with `./bin/configure_auth`.
