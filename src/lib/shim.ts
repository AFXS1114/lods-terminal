// This is a dummy shim file used to bypass Node.js module requirements
// during the client-side bundling process for static exports.

// Provide common named exports that are often required by Node-specific libraries
// even if they are being bundled for the browser incorrectly.

export const randomBytes = (size: number) => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(new Uint8Array(size));
  }
  return new Uint8Array(size);
};

export const createHash = () => ({
  update: () => ({
    digest: () => ""
  })
});

export const createHmac = () => ({
  update: () => ({
    digest: () => ""
  })
});

export const pbkdf2 = () => {};
export const pbkdf2Sync = () => new Uint8Array(0);

// Path mocks
export const resolve = (...args: string[]) => args.join('/');
export const join = (...args: string[]) => args.join('/');
export const relative = (from: string, to: string) => to;
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/') || '.';
export const basename = (p: string) => p.split('/').pop() || '';
export const isAbsolute = (p: string) => p.startsWith('/');
export const normalize = (p: string) => p;
export const extname = (p: string) => {
  const base = basename(p);
  const index = base.lastIndexOf('.');
  return index < 1 ? '' : base.substring(index);
};
export const parse = (p: string) => ({
  root: '/',
  dir: dirname(p),
  base: basename(p),
  ext: extname(p),
  name: basename(p).replace(/\.[^/.]+$/, "")
});
export const format = (p: any) => (p.dir || "") + "/" + (p.base || "");
export const sep = '/';
export const delimiter = ':';

// Support for path.posix.join and path.win32.join
const pathMock = {
  resolve,
  join,
  relative,
  dirname,
  basename,
  isAbsolute,
  normalize,
  extname,
  parse,
  format,
  sep,
  delimiter,
};

export const posix = pathMock;
export const win32 = pathMock;

// FS mocks
export const readFileSync = () => Buffer.from("");
export const promises = {
  readFile: async () => Buffer.from(""),
  writeFile: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
};

// Export fs/promises methods at top level for direct aliasing
export const readFile = promises.readFile;
export const writeFile = promises.writeFile;
export const mkdir = promises.mkdir;
export const readdir = promises.readdir;

// OS mocks
export const platform = () => "browser";
export const arch = () => "javascript";
export const release = () => "";
export const type = () => "";
export const uptime = () => 0;
export const hostname = () => "localhost";

// Dgram mocks
export const createSocket = () => ({
  on: () => {},
  send: () => {},
  close: () => {},
  bind: () => {},
});

// Express mock
const expressMock = () => ({
  use: () => {},
  get: () => {},
  post: () => {},
  listen: () => {},
  set: () => {},
  engine: () => {},
});
expressMock.static = () => () => {};
expressMock.json = () => () => {};
expressMock.urlencoded = () => () => {};
export const express = expressMock;

// Utility mocks
export const getPort = async () => 0;

// Util exports
export const inspect = (obj: any) => JSON.stringify(obj);
export const TextEncoder = typeof globalThis !== 'undefined' ? globalThis.TextEncoder : class {};
export const TextDecoder = typeof globalThis !== 'undefined' ? globalThis.TextDecoder : class {};

// Net/TLS/HTTP/HTTPS mocks
export class Agent {}
export const createServer = () => ({ listen: () => {}, on: () => {} });
export const connect = () => ({ on: () => {}, write: () => {}, end: () => {} });
export const request = () => ({ on: () => {}, write: () => {}, end: () => {} });
export const get = () => ({ on: () => {} });

// Stream mocks
export class Readable {
  on() { return this; }
  once() { return this; }
  emit() { return true; }
  pipe() { return this; }
  unpipe() { return this; }
  resume() { return this; }
  pause() { return this; }
  setEncoding() { return this; }
  read() { return null; }
  destroy() { return this; }
}
export class Writable {
  on() { return this; }
  once() { return this; }
  emit() { return true; }
  write() { return true; }
  end() { return this; }
  destroy() { return this; }
}
export class Duplex extends Readable {}
export class Transform extends Duplex {}
export class PassThrough extends Transform {}

// Zlib mocks
export const createGzip = () => new PassThrough();
export const createGunzip = () => new PassThrough();
export const createDeflate = () => new PassThrough();
export const createInflate = () => new PassThrough();
export const inflateSync = (v: any) => v;
export const deflateSync = (v: any) => v;

// Child Process mocks
export const exec = () => {};
export const execSync = () => Buffer.from("");
export const spawn = () => ({ on: () => {}, stdout: new Readable(), stderr: new Readable() });

// DNS mocks
export const lookup = () => {};
export const resolve4 = () => {};

// Default export containing all mocks for CJS compatibility
const shim = {
  randomBytes,
  createHash,
  createHmac,
  pbkdf2,
  pbkdf2Sync,
  resolve,
  join,
  relative,
  dirname,
  basename,
  isAbsolute,
  normalize,
  extname,
  parse,
  format,
  sep,
  delimiter,
  posix,
  win32,
  readFileSync,
  promises,
  readFile,
  writeFile,
  mkdir,
  readdir,
  platform,
  arch,
  release,
  type,
  uptime,
  hostname,
  createSocket,
  express,
  getPort,
  inspect,
  TextEncoder,
  TextDecoder,
  Agent,
  createServer,
  connect,
  request,
  get,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  createGzip,
  createGunzip,
  createDeflate,
  createInflate,
  inflateSync,
  deflateSync,
  exec,
  execSync,
  spawn,
  lookup,
  resolve4,
};

export default shim;
