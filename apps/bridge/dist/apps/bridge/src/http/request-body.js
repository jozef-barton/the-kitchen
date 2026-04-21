import { once } from 'node:events';
const DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MiB
export class PayloadTooLargeError extends Error {
    statusCode = 413;
    constructor(limit) {
        super(`Request body exceeds the ${limit}-byte limit.`);
        this.name = 'PayloadTooLargeError';
    }
}
export async function readJsonBody(request, options = {}) {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
    const declaredLength = Number(request.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        throw new PayloadTooLargeError(maxBytes);
    }
    const chunks = [];
    let receivedBytes = 0;
    let aborted = false;
    request.on('data', (chunk) => {
        if (aborted)
            return;
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += buffer.length;
        if (receivedBytes > maxBytes) {
            aborted = true;
            request.destroy(new PayloadTooLargeError(maxBytes));
            return;
        }
        chunks.push(buffer);
    });
    await once(request, 'end');
    if (aborted) {
        throw new PayloadTooLargeError(maxBytes);
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    return raw.length > 0 ? JSON.parse(raw) : {};
}
