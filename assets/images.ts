import { createImageTexture } from "../client/lib/createTexture";
import GraphicsEngine from "../client/render/engine/GraphicsEngine";
import testTexture from "./test-texture.png";

export const getImages = (engine: GraphicsEngine) => ({
	testTexture: createImageTexture(engine, testTexture),
});

export type ImageId = keyof ReturnType<typeof getImages>;
