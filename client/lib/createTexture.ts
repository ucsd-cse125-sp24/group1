import { TextModelFont } from "../../common/messages";
import { WebGlUtils } from "../render/engine/WebGlUtils";

const canvas = document.createElement("canvas");
const c = canvas.getContext("2d");
if (!c) {
	throw new TypeError("Failed to create texture for text textures");
}

export type Texture = {
	texture: WebGLTexture;
	width: number;
	height: number;
};

export const createTextTexture = (
	utils: WebGlUtils,
	text: string,
	height: number,
	{
		color = "white",
		family = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
		weight = "normal",
	}: TextModelFont = {},
): Texture => {
	const { gl } = utils;
	const texture = gl.createTexture();
	if (!texture) {
		throw new Error("Failed to create text texture object");
	}
	utils.bindTexture(0, "2d", texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, height, 0, gl.RED, gl.UNSIGNED_BYTE, null);

	const result: Texture = { texture, width: 1, height };

	document.fonts.ready.then(() => {
		c.font = `${weight} ${height}px/1 ${family}`;
		result.width = 1 << Math.ceil(Math.log2(c.measureText(text).width));
		canvas.width = result.width;
		canvas.height = height;
		c.font = `${weight} ${height}px/1 ${family}`;
		c.textAlign = "center";
		c.textBaseline = "bottom";
		c.fillStyle = color;
		c.fillText(text, result.width / 2, height);
		utils.bindTexture(0, "2d", texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);
	});

	return result;
};

export const createImageTexture = (utils: WebGlUtils, url: string): Texture => {
	const { gl } = utils;
	const texture = gl.createTexture();
	if (!texture) {
		throw new Error("Failed to create image texture object");
	}
	utils.bindTexture(0, "2d", texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, null);

	const result: Texture = { texture, width: 1, height: 1 };

	fetch(url)
		.then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}: ${url} (${r.url})`))))
		.then(createImageBitmap)
		.then((image) => {
			result.width = image.width;
			result.height = image.height;
			utils.bindTexture(0, "2d", texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.generateMipmap(gl.TEXTURE_2D);
		});

	return result;
};
