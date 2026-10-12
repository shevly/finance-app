# Tricount-App

## Verwendete Packages

- **express** – Webserver
- **express-handlebars** – Template-Engine
- **pg** – PostgreSQL-Treiber
- **dotenv** – laedt Variablen aus `.env`

## Start

```bash
npm install
npm start
```

## Tests und CI

Bei jedem Push läuft auf GitHub Actions eine CI-Pipeline (`.github/workflows/ci.yml`):

1. Abhängigkeiten installieren (`npm ci`)
2. Syntax von `app.js` und `db.js` prüfen
3. `schema.sql` in eine frische PostgreSQL-Datenbank (Service-Container) einspielen
4. Integrationstests ausführen (`npm test`): Startseite, Zugriffsschutz, Registrierung, Login, Session

Lokal ausführen (mit gesetzter `DB_CON_STRING` und eingespieltem Schema):

```bash
npm test
```
