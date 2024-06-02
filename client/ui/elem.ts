/**
 * A convenient helper function for creating DOM elements.
 *
 * @example
 * // Creates <div class="box">Hello, <strong>Voelker</strong>!</div>
 * elem('div', {
 *   className: 'box',
 *   contents: ['Hello, ', elem('strong', { textContent: 'Voelker' }), '!']
 * })
 */
export function elem<K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	// Can't use `children` because it conflicts with HTMLElement.children
	{
		contents = [],
		classes = [],
		...props
	}: Partial<HTMLElementTagNameMap[K]> & { contents?: (Node | string)[]; classes?: string[] } = {},
): HTMLElementTagNameMap[K] {
	const element = document.createElement(tagName);
	Object.assign(element, props);
	element.append(...contents);
	for (const className of classes) {
		element.classList.add(className);
	}
	return element;
}
