import { ContactMaterial } from "cannon-es";
import { PlayerMaterial, GroundMaterial, SlipperyMaterial, ItemMaterial, SpawnerMaterial } from "./SourceMaterials";

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

export const ItemPlayerCM = new ContactMaterial(PlayerMaterial, ItemMaterial, {
	friction: 0.0,
	restitution: 0.2,
});

export const ItemItemCM = new ContactMaterial(ItemMaterial, ItemMaterial, {
	friction: 0.05,
	restitution: 0.1,
});

export const ItemGroundCM = new ContactMaterial(GroundMaterial, ItemMaterial, {
	friction: 0.1,
	restitution: 0.2,
});

export const PlayerSpawnerCM = new ContactMaterial(PlayerMaterial, SpawnerMaterial, {
	friction: 0.01,
	restitution: 0.95,
});

export const ItemSpawnerCM = new ContactMaterial(ItemMaterial, SpawnerMaterial, {
	friction: 0.05,
	restitution: 1.35,
});

export const SpawnerGroundCM = new ContactMaterial(GroundMaterial, SpawnerMaterial, {
	friction: 1.0,
	restitution: 0,
});
