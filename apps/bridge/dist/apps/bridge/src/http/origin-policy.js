const BRIDGE_REQUEST_HEADER = 'x-hermes-bridge';
const BRIDGE_REQUEST_HEADER_VALUE = '1';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function isLocalHostname(hostname) {
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}
function normalizePortFromOrigin(origin) {
    if (origin.port) {
        return origin.port;
    }
    return origin.protocol === 'https:' ? '443' : '80';
}
function parseHost(hostHeader) {
    if (!hostHeader)
        return null;
    // Support IPv6-bracketed hosts like [::1]:8787 as well as plain host:port.
    if (hostHeader.startsWith('[')) {
        const closingBracket = hostHeader.indexOf(']');
        if (closingBracket === -1)
            return null;
        const hostname = hostHeader.slice(1, closingBracket);
        const portPart = hostHeader.slice(closingBracket + 1);
        const port = portPart.startsWith(':') ? portPart.slice(1) : '';
        return { hostname, port };
    }
    const [hostname, port = ''] = hostHeader.split(':');
    return { hostname, port };
}
export function evaluateLocalOriginPolicy(request, options = {}) {
    // Defense-in-depth against DNS rebinding: reject requests whose Host header is not localhost.
    const parsedHost = parseHost(request.headers.host);
    if (!parsedHost || !isLocalHostname(parsedHost.hostname)) {
        return {
            allowed: false,
            message: 'The Hermes bridge only accepts requests with a localhost Host header.'
        };
    }
    // CSRF guard: any state-changing request must carry the bridge header. The browser's same-origin
    // policy blocks cross-site pages from setting custom headers without a preflight, which we then
    // reject via the Origin policy below.
    if (!SAFE_METHODS.has(request.method ?? 'GET')) {
        const headerValue = request.headers[BRIDGE_REQUEST_HEADER];
        const actualValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        if (actualValue !== BRIDGE_REQUEST_HEADER_VALUE) {
            return {
                allowed: false,
                message: `The Hermes bridge rejected the request: missing ${BRIDGE_REQUEST_HEADER} header.`
            };
        }
    }
    const originHeader = request.headers.origin;
    if (!originHeader) {
        return {
            allowed: true
        };
    }
    if (originHeader === 'null') {
        return {
            allowed: false,
            message: 'The Hermes bridge only accepts requests from trusted local browser origins.'
        };
    }
    let origin;
    try {
        origin = new URL(originHeader);
    }
    catch {
        return {
            allowed: false,
            message: 'The Hermes bridge rejected an invalid Origin header.'
        };
    }
    if (!isLocalHostname(origin.hostname)) {
        return {
            allowed: false,
            message: `The Hermes bridge only accepts localhost or 127.0.0.1 origins. Rejected ${origin.origin}.`
        };
    }
    const requestPort = parsedHost.port ||
        (typeof request.socket.localPort === 'number' ? String(request.socket.localPort) : undefined);
    const allowedPorts = new Set(['5173', '4173', '8787', ...(options.allowedPorts ?? [])]);
    if (requestPort) {
        allowedPorts.add(requestPort);
    }
    if (!allowedPorts.has(normalizePortFromOrigin(origin))) {
        return {
            allowed: false,
            message: `The Hermes bridge rejected origin ${origin.origin}. Only trusted local ports are allowed.`
        };
    }
    return {
        allowed: true,
        allowOrigin: origin.origin
    };
}
export function createCorsHeaders(allowOrigin) {
    return allowOrigin
        ? {
            'access-control-allow-origin': allowOrigin,
            'access-control-allow-headers': `content-type, ${BRIDGE_REQUEST_HEADER}`,
            'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
            vary: 'Origin'
        }
        : {
            vary: 'Origin'
        };
}
export const BRIDGE_REQUEST_HEADER_NAME = BRIDGE_REQUEST_HEADER;
export const BRIDGE_REQUEST_HEADER_EXPECTED_VALUE = BRIDGE_REQUEST_HEADER_VALUE;
