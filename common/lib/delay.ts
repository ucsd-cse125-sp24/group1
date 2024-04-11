/**
 * Returns a promise that resolves after the given amount of time. Useful for
 * waiting in an async function. Async version of `setTimeout`.
 *
 * @param ms Time to wait, in milliseconds.
 *
 * @example
 * // Print `hey` every second
 * while (true) {
 *   console.log("hey");
 *   await delay(1000);
 * }
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
