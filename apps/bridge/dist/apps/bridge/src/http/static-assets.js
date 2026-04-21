import fs from 'node:fs';
import path from 'node:path';
const themePlaceholder = '__HERMES_THEME_MODE__';
const SECURITY_HEADERS = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'"
};
function isWithinRoot(resolvedRoot, resolvedFilePath) {
    return resolvedFilePath === resolvedRoot || resolvedFilePath.startsWith(`${resolvedRoot}${path.sep}`);
}
function writeHtml(response, filePath, themeMode) {
    const html = fs.readFileSync(filePath, 'utf8').replaceAll(themePlaceholder, themeMode);
    response.writeHead(200, { ...SECURITY_HEADERS, 'content-type': 'text/html; charset=utf-8' });
    response.end(html);
}
export function serveStaticAsset(response, staticDirectory, pathname, themeMode = 'dark') {
    const relativePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(staticDirectory, relativePath);
    const resolvedFilePath = path.resolve(filePath);
    const resolvedRoot = path.resolve(staticDirectory);
    if (!isWithinRoot(resolvedRoot, resolvedFilePath)) {
        response.statusCode = 403;
        response.end('Forbidden');
        return;
    }
    if (!fs.existsSync(resolvedFilePath) || fs.statSync(resolvedFilePath).isDirectory()) {
        const fallbackPath = path.join(staticDirectory, 'index.html');
        if (fs.existsSync(fallbackPath)) {
            writeHtml(response, fallbackPath, themeMode);
            return;
        }
        response.statusCode = 404;
        response.end('Not found');
        return;
    }
    const extension = path.extname(resolvedFilePath);
    const contentType = extension === '.html'
        ? 'text/html; charset=utf-8'
        : extension === '.js'
            ? 'application/javascript; charset=utf-8'
            : extension === '.css'
                ? 'text/css; charset=utf-8'
                : extension === '.json'
                    ? 'application/json; charset=utf-8'
                    : extension === '.svg'
                        ? 'image/svg+xml'
                        : 'application/octet-stream';
    if (extension === '.html') {
        writeHtml(response, resolvedFilePath, themeMode);
        return;
    }
    response.writeHead(200, { ...SECURITY_HEADERS, 'content-type': contentType });
    fs.createReadStream(resolvedFilePath).pipe(response);
}
