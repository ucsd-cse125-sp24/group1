/**
 * A helper function for loading `Image` objects. Returns a promise that
 * resolves to the image when it loads.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = url;
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => reject(new Error(`Image failed to load: ${url}`)));
	});
}
