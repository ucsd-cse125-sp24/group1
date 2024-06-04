import { PlayerCamera } from "../../render/camera/PlayerCamera";
import { elem } from "../elem";
import styles from "./Options.module.css";

const DEFAULT_FOV = 60;
const DEFAULT_SENSITIVITY = 0.4;

export class Options {
	fov = DEFAULT_FOV;
	#fovSlider = elem("input", { type: "range", min: "1", max: "179", name: "fov", value: `${this.fov}` });
	#fovValue = elem("input", { type: "number", min: "1", max: "179", name: "fov-value", value: `${this.fov}` });
	#sensitivitySlider = elem("input", { type: "range", min: "0", max: "2", step: "0.01", name: "sensitivity" });
	#sensitivityValue = elem("input", { type: "number", step: "0.01", name: "sensitivity-value" });
	#resetBtn = elem("button", { classes: ["button", styles.resetBtn], textContent: "Reset" });
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
		this.#resetBtn,
	];

	listen(camera: PlayerCamera) {
		this.#setFov(+localStorage["cse125.2024.g1.options.fov"], localStorage);
		this.#setSensitivity(camera, +localStorage["cse125.2024.g1.options.sensitivity"], localStorage);

		this.#fovSlider.addEventListener("input", () => {
			this.#setFov(+this.#fovSlider.value, this.#fovSlider);
		});
		this.#fovValue.addEventListener("input", () => {
			this.#setFov(+this.#fovValue.value, this.#fovValue);
		});

		this.#sensitivitySlider.addEventListener("input", () => {
			this.#setSensitivity(camera, +this.#sensitivitySlider.value, this.#sensitivitySlider);
		});
		this.#sensitivityValue.addEventListener("input", () => {
			this.#setSensitivity(camera, +this.#sensitivityValue.value, this.#sensitivityValue);
		});

		this.#resetBtn.addEventListener("click", () => {
			this.#setFov();
			this.#setSensitivity(camera);
		});
	}

	#setFov(fov?: number, source?: unknown) {
		fov ||= DEFAULT_FOV;
		this.fov = fov;
		if (source !== localStorage) {
			localStorage["cse125.2024.g1.options.fov"] = fov === DEFAULT_FOV ? "" : fov;
		}
		if (source !== this.#fovSlider) {
			this.#fovSlider.value = `${fov}`;
		}
		if (source !== this.#fovValue) {
			this.#fovValue.value = `${fov}`;
		}
	}

	#setSensitivity(camera: PlayerCamera, sensitivity?: number, source?: unknown) {
		sensitivity ||= DEFAULT_SENSITIVITY;
		camera.sensitivity = sensitivity;
		if (source !== localStorage) {
			localStorage["cse125.2024.g1.options.sensitivity"] = sensitivity === DEFAULT_SENSITIVITY ? "" : sensitivity;
		}
		if (source !== this.#sensitivitySlider) {
			this.#sensitivitySlider.value = `${sensitivity}`;
		}
		if (source !== this.#sensitivityValue) {
			this.#sensitivityValue.value = `${sensitivity}`;
		}
	}
}
