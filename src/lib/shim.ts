
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

// Add other potential named exports as needed
export const pbkdf2 = () => {};
export const pbkdf2Sync = () => new Uint8Array(0);

const shim = {};
export default shim;
