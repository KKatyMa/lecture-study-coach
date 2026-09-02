/** Browser polyfills required by pdf.js on older mobile Safari versions. */

export function ensurePdfPolyfills(): void {
  if (typeof Promise.withResolvers !== "function") {
    Promise.withResolvers = function withResolvers<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  if (typeof Promise.try !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Promise as any).try = function tryPromise(
      callback: (...args: unknown[]) => unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      return new Promise((resolve, reject) => {
        try {
          Promise.resolve(callback(...args)).then(resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    };
  }
}
