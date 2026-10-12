// Integrationstests für die finance-App (Node.js Test Runner, ohne Zusatzpakete).
// Startet die App gegen eine echte PostgreSQL-Datenbank und prüft
// Startseite, Zugriffsschutz, Registrierung, Login und Sessions.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;
let server;

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(BASE + '/');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error('Server ist nicht rechtzeitig gestartet');
}

function form(data) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
    redirect: 'manual'
  };
}

before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'app.js')], {
    env: process.env,
    stdio: 'inherit'
  });
  await waitForServer();
});

after(() => {
  if (server) server.kill();
});

const user = {
  username: 'ci_user_' + Date.now(),
  email: `ci_${Date.now()}@example.com`,
  password: 'geheim123'
};

test('Startseite antwortet mit Status 200', async () => {
  const res = await fetch(BASE + '/');
  assert.strictEqual(res.status, 200);
});

test('Dashboard ohne Login leitet auf /login weiter', async () => {
  const res = await fetch(BASE + '/dashboard', { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), '/login');
});

test('Registrierung legt einen neuen Nutzer an', async () => {
  const res = await fetch(BASE + '/signup', form(user));
  assert.strictEqual(res.status, 302);
});

test('Login mit falschem Passwort wird abgelehnt', async () => {
  const res = await fetch(BASE + '/login', form({ identifier: user.username, password: 'falsch' }));
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Passwort falsch/);
});

test('Login mit richtigem Passwort öffnet das Dashboard', async () => {
  const login = await fetch(BASE + '/login', form({ identifier: user.username, password: user.password }));
  assert.strictEqual(login.status, 302);
  assert.strictEqual(login.headers.get('location'), '/dashboard');

  const cookie = login.headers.get('set-cookie');
  assert.ok(cookie, 'Session-Cookie fehlt');

  const dashboard = await fetch(BASE + '/dashboard', {
    headers: { Cookie: cookie.split(';')[0] },
    redirect: 'manual'
  });
  assert.strictEqual(dashboard.status, 200);
});
