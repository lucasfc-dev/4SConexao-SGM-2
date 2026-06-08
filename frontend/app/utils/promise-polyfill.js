// Polyfill for Promise.withResolvers() to support Safari and other browsers
// that don't have this method implemented yet

if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Export a function that ensures the polyfill is loaded
export function ensurePromisePolyfill() {
  if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
    Promise.withResolvers = function() {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

// Auto-load the polyfill when this module is imported
if (typeof window !== 'undefined') {
  ensurePromisePolyfill();
}