/** Clamps x to the range [low, high]. */
export function clamp(x: number, low: number, high: number) {
	return Math.max(low, Math.min(x, high));
}

/**
 * For dividend n and divisor d, computes n mod d. This differs from the `%`
 * (remainder) operator when n and d have different signs; n % d will have the
 * same sign as n, while n mod d will have the same sign as d.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder#description
 */
export function modulo(n: number, d: number) {
	return ((n % d) + d) % d;
}
