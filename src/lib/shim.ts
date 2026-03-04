
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

// FS mocks
export const readFileSync = () => Buffer.from("");
export const promises = {
  readFile: async () => Buffer.from(""),
  writeFile: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
};

// OS mocks
export const platform = () => "browser";
export const arch = () => "javascript";

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
  extname,
  parse,
  readFileSync,
  promises,
  platform,
  arch
};

export default shim;
