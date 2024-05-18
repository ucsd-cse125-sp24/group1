import { ContactMaterial } from "cannon-es";
import { PlayerMaterial, GroundMaterial, SlipperyMaterial } from "./SourceMaterials";

// whenever a new CM is added, a new line needed to be added to the world initialization in TheWorld to add the contact material
export const PlayerGroundCM = new ContactMaterial(PlayerMaterial, GroundMaterial, {
	friction: 0,
	restitution: 0,
	contactEquationStiffness: 1e10,
	contactEquationRelaxation: 4,
});

export const PlayerPlayerCM = new ContactMaterial(PlayerMaterial, PlayerMaterial, {
	friction: 0.2,
});

export const SlipperyGroundCM = new ContactMaterial(SlipperyMaterial, GroundMaterial, {
	friction: 0.05,
});

export const PlayerSlipperyCM = new ContactMaterial(PlayerMaterial, SlipperyMaterial, {
	friction: 0,
});
