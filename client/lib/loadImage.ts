export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = url;
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", () => reject(new Error(`Image failed to load: ${url}`)));
	});
}
