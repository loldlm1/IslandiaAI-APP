export async function until<T>(promise: Promise<T>): Promise<[unknown, T | undefined]> {
  try {
    const result = await promise;
    return [undefined, result];
  } catch (error) {
    return [error, undefined];
  }
}
