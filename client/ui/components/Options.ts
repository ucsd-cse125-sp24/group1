import { PlayerCamera } from "../../render/camera/PlayerCamera";
import { elem } from "../elem";
import styles from "./Options.module.css";

export class Options {
	fov = 60;
	#fovSlider = elem("input", { type: "range", min: "1", max: "179", name: "fov", value: `${this.fov}` });
	#fovValue = elem("input", { type: "number", min: "1", max: "179", name: "fov-value", value: `${this.fov}` });
	#sensitivitySlider = elem("input", { type: "range", min: "0", max: "2", step: "0.01", name: "sensitivity" });
	#sensitivityValue = elem("input", { type: "number", step: "0.01", name: "sensitivity-value" });
	elements = [
		elem("div", {
			className: styles.slider,
			contents: [
				elem("div", { className: styles.label, textContent: "FOV" }),
				this.#fovSlider,
				elem("div", { className: styles.input, contents: [this.#fovValue, elem("span", { textContent: "°" })] }),
			],
		}),
		elem("div", {
			className: styles.slider,
			contents: [
				elem("div", { className: styles.label, textContent: "Mouse sensitivity" }),
				this.#sensitivitySlider,
				elem("div", {
					className: styles.input,
					contents: [this.#sensitivityValue, elem("span", { textContent: "°/px" })],
				}),
			],
		}),
	];

	listen(camera: PlayerCamera) {
		this.#fovSlider.addEventListener("input", () => {
			this.#fovValue.value = this.#fovSlider.value;
			this.fov = +this.#fovSlider.value;
		});
		this.#fovValue.addEventListener("input", () => {
			this.#fovSlider.value = this.#fovValue.value;
			this.fov = +this.#fovValue.value;
		});

		this.#sensitivitySlider.value = `${camera.sensitivity}`;
		this.#sensitivityValue.value = `${camera.sensitivity}`;
		this.#sensitivitySlider.addEventListener("input", () => {
			this.#sensitivityValue.value = this.#sensitivitySlider.value;
			camera.sensitivity = +this.#sensitivitySlider.value;
		});
		this.#sensitivityValue.addEventListener("input", () => {
			this.#sensitivitySlider.value = this.#sensitivityValue.value;
			camera.sensitivity = +this.#sensitivityValue.value;
		});
	}
}
