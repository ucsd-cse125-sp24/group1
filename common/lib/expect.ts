/**
 * A helper function that throws an error. Useful for asserting that a value
 * shouldn't be null.
 *
 * @param message Error message to display if the value is null.
 *
 * @example
 * const value = document.getElementById("my-element") ?? expect("Could not find element");
 */
export function expect(message = "Expected value, got null"): never {
	throw new TypeError(message);
}
