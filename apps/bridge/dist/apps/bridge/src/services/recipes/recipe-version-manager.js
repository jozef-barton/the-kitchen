import fs from 'node:fs';
import path from 'node:path';
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
function assertValidVersion(version) {
    if (!VERSION_PATTERN.test(version)) {
        throw new Error(`Invalid version "${version}": expected major.minor.patch (digits only).`);
    }
}
function versionsDir(folderPath) {
    return path.join(folderPath, 'versions');
}
export function listVersions(folderPath) {
    const dir = versionsDir(folderPath);
    if (!fs.existsSync(dir))
        return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .map(f => {
        const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return { version: raw.version, summary: raw.summary, savedAt: raw.savedAt };
    });
}
export function getVersion(folderPath, version) {
    assertValidVersion(version);
    const fp = path.join(versionsDir(folderPath), `v${version}.json`);
    if (!fs.existsSync(fp))
        return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}
function incrementVersion(v) {
    const parts = v.replace(/^v/, '').split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN))
        return '1.0.1';
    return [parts[0], parts[1], (parts[2] ?? 0) + 1].join('.');
}
export function saveVersion(folderPath, summary, data) {
    const existing = listVersions(folderPath);
    const latest = existing[existing.length - 1]?.version;
    const newVersion = existing.length === 0 ? '1.0.0' : incrementVersion(latest ?? '1.0.0');
    const dir = versionsDir(folderPath);
    fs.mkdirSync(dir, { recursive: true });
    const entry = { version: newVersion, summary, savedAt: new Date().toISOString(), ...data };
    fs.writeFileSync(path.join(dir, `v${newVersion}.json`), JSON.stringify(entry, null, 2), 'utf8');
    return newVersion;
}
export function rollbackToVersion(folderPath, version) {
    assertValidVersion(version);
    const v = getVersion(folderPath, version);
    if (!v)
        return null;
    fs.writeFileSync(path.join(folderPath, 'manifest.json'), JSON.stringify(v.manifest, null, 2), 'utf8');
    fs.writeFileSync(path.join(folderPath, 'runtime.json'), JSON.stringify(v.runtime, null, 2), 'utf8');
    if (v.spec)
        fs.writeFileSync(path.join(folderPath, 'spec.json'), JSON.stringify(v.spec, null, 2), 'utf8');
    if (v.fixture)
        fs.writeFileSync(path.join(folderPath, 'fixture.json'), JSON.stringify(v.fixture, null, 2), 'utf8');
    return v;
}
