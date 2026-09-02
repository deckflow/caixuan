import http from 'http';
import chalk from 'chalk';
import ora from 'ora';

const LOGIN_TIMEOUT = 300_000;

function isChineseCliLocale(): boolean {
  const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '';
  return locale.toLowerCase().includes('zh');
}

async function openBrowser(url: string): Promise<void> {
  const { default: open } = await import('open');
  await open(url);
}

function startCallbackServer(
  port: number
): Promise<{ token: string; spaceId?: string; server: http.Server }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutHandle: NodeJS.Timeout;

    const settleResolve = (value: { token: string; spaceId?: string; server: http.Server }): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(value);
    };

    const settleReject = (error: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      const token = url.searchParams.get('token');
      const spaceId =
        url.searchParams.get('spaceId') || url.searchParams.get('space_id') || undefined;
      const isZh = isChineseCliLocale();

      if (token) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${isZh ? '登录成功' : 'Login Successful'}</title></head><body><h1>${isZh ? '登录成功！' : 'Login Successful!'}</h1><p>${isZh ? '你可以关闭此窗口并返回终端。' : 'You can close this window and return to your terminal.'}</p></body></html>`);
        settleResolve({ token, spaceId, server });
        return;
      }

      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(isZh ? '缺少 token 参数' : 'Missing token parameter');
    });

    server.on('error', (err) => settleReject(err));

    server.listen(port, () => {
      // started
    });

    timeoutHandle = setTimeout(() => {
      server.close();
      settleReject(new Error('Login timeout. Please try again.'));
    }, LOGIN_TIMEOUT);
  });
}

export function normalizeLoginBase(apiBase: string): string {
  const u = new URL(apiBase);
  u.pathname = u.pathname.replace(/\/api\/?$/, '/').replace(/\/v1\/?$/, '/');
  return `${u.origin}${u.pathname}`.replace(/\/$/, '');
}

export function applyBasicAuthToUrl(url: string, basicAuth?: string): string {
  if (!basicAuth) return url;

  const sep = basicAuth.indexOf(':');
  if (sep <= 0 || sep === basicAuth.length - 1) return url;

  const u = new URL(url);
  u.username = basicAuth.slice(0, sep);
  u.password = basicAuth.slice(sep + 1);
  return u.toString();
}

export function maskBasicAuthInUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.username) return url;
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}

export function buildLoginUrl(apiBase: string, callbackUrl: string, basicAuth?: string): string {
  const loginBase = normalizeLoginBase(apiBase);
  const url = `${loginBase}/cli/auth?redirect_url=${encodeURIComponent(callbackUrl)}`;
  return applyBasicAuthToUrl(url, basicAuth);
}

export async function runLoginFlow(options: {
  apiBase: string;
  port: number;
  jsonOutput: boolean;
  basicAuth?: string;
  reason?: 'explicit' | 'unauthorized';
}): Promise<{ token: string; spaceId?: string }> {
  const isZh = isChineseCliLocale();
  const callbackUrl = `http://localhost:${options.port}`;
  const loginUrl = buildLoginUrl(options.apiBase, callbackUrl, options.basicAuth);
  const displayLoginUrl = maskBasicAuthInUrl(loginUrl);

  if (!options.jsonOutput) {
    if (options.reason === 'unauthorized') {
      console.log(chalk.yellow(isZh ? '\n认证已失效，需要重新登录。\n' : '\nAuthentication expired. Please log in again.\n'));
    } else {
      console.log(chalk.cyan('\n🔐 Caixuan Login\n'));
    }
    console.log(`Opening browser to: ${chalk.underline(displayLoginUrl)}`);
    console.log(chalk.dim(`Waiting for authentication on port ${options.port}...\n`));
  }

  const serverPromise = startCallbackServer(options.port);

  try {
    await openBrowser(loginUrl);
  } catch {
    if (!options.jsonOutput) {
      console.log(chalk.yellow(isZh ? '\n无法自动打开浏览器。' : '\nUnable to open browser automatically.'));
      console.log(`${isZh ? '请手动打开此链接：' : 'Please open this link manually:'}\n${chalk.cyan(displayLoginUrl)}\n`);
    }
  }

  let spinner: ReturnType<typeof ora> | undefined;
  if (!options.jsonOutput) {
    spinner = ora('Waiting for login...').start();
  }

  const { token, spaceId, server } = await serverPromise;
  server.close();

  if (spinner) {
    spinner.succeed('Login successful!');
  }

  return { token, spaceId };
}
