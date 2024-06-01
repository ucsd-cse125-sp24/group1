import { WebGlUtils } from "../render/engine/WebGlUtils";

const canvas = document.createElement("canvas");
const c = canvas.getContext("2d");
if (!c) {
	throw new TypeError("Failed to create texture for text textures");
}

export type TextTexture = {
	texture: WebGLTexture;
	width: number;
	height: number;
};

export const createTextTexture = (
	{ gl }: WebGlUtils,
	text: string,
	height: number,
	font = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
): TextTexture => {
	c.font = `${height}px/1 ${font}`;
	const width = 1 << Math.ceil(Math.log2(c.measureText(text).width));
	canvas.width = width;
	canvas.height = height;
	c.font = `${height}px ${font}`;
	c.textAlign = "center";
	c.textBaseline = "bottom";
	c.fillStyle = "white";
	c.fillText(text, width / 2, height);

	const texture = gl.createTexture();
	if (!texture) {
		throw new Error("Failed to create text texture object");
	}
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.generateMipmap(gl.TEXTURE_2D);
	return { texture, width, height };
};
