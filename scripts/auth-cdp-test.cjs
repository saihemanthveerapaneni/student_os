const { spawn } = require('child_process');
const http = require('http');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9333;
const profile = 'C:\\tmp\\codex-chrome-auth-test';
const cp = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getJson = (path) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path }, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => resolve(JSON.parse(data)));
      })
      .on('error', reject);
  });

const putJson = (path) =>
  new Promise((resolve, reject) => {
    const request = http.request(
      { host: '127.0.0.1', port, path, method: 'PUT' },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => resolve(JSON.parse(data)));
      }
    );
    request.on('error', reject);
    request.end();
  });

async function waitJson(path) {
  for (let i = 0; i < 60; i += 1) {
    try {
      return await getJson(path);
    } catch {
      await sleep(250);
    }
  }
  throw new Error('CDP not ready');
}

let id = 0;
const pending = new Map();
let events = [];

function keepEvent(message) {
  if (message.method === 'Runtime.exceptionThrown' || message.method === 'Runtime.consoleAPICalled') {
    return true;
  }

  if (message.method === 'Log.entryAdded') {
    const text = message.params?.entry?.text ?? '';
    return !text.includes('/_next/webpack-hmr');
  }

  if (message.method === 'Network.responseReceived' || message.method === 'Network.loadingFailed') {
    const url = message.params?.response?.url ?? message.params?.request?.url ?? '';
    return url.includes('supabase.co') || url.includes('/auth/v1/');
  }

  return false;
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}

function evaluate(ws, expression) {
  return send(ws, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function main() {
  await waitJson('/json/version');
  const target = await putJson('/json/new?http://127.0.0.1:3000/signup');
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id).resolve(message);
      pending.delete(message.id);
      return;
    }
    if (message.method && keepEvent(message)) {
      events.push(message);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  await send(ws, 'Runtime.enable');
  await send(ws, 'Log.enable');
  await send(ws, 'Page.enable');
  await send(ws, 'Network.enable');

  async function navigate(url) {
    events = [];
    await send(ws, 'Page.navigate', { url });
    await sleep(2500);
  }

  async function bodyText() {
    const result = await evaluate(ws, 'document.body.innerText');
    return result.result.result.value;
  }

  async function currentUrl() {
    const result = await evaluate(ws, 'location.href');
    return result.result.result.value;
  }

  async function testSignUp() {
    await navigate('http://127.0.0.1:3000/signup');
    const email = `codex.browser.${Date.now()}@gmail.com`;
    await evaluate(
      ws,
      `
      const setValue = (element, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setValue(document.querySelector('#full-name'), 'Codex Browser User');
      setValue(document.querySelector('#email'), '${email}');
      setValue(document.querySelector('#password'), 'Password123!');
      document.querySelector('button[type=submit]').click();
      `
    );
    await sleep(6000);
    return {
      url: await currentUrl(),
      bodyText: await bodyText(),
      events,
    };
  }

  async function testSignIn() {
    await navigate('http://127.0.0.1:3000/signin');
    await evaluate(
      ws,
      `
      const setValue = (element, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setValue(document.querySelector('input[type=email]'), 'codex-nonexistent@example.com');
      setValue(document.querySelector('input[type=password]'), 'Password123!');
      document.querySelector('button[type=submit]').click();
      `
    );
    await sleep(6000);
    return {
      url: await currentUrl(),
      bodyText: await bodyText(),
      events,
    };
  }

  const signUp = await testSignUp();
  const signIn = await testSignIn();
  ws.close();
  cp.kill();
  console.log(JSON.stringify({ signUp, signIn }, null, 2));
}

main().catch((error) => {
  try {
    cp.kill();
  } catch {
    // Chrome may already be closed.
  }
  console.error(error);
  process.exit(1);
});
