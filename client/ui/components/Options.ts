import { PlayerCamera } from "../../render/camera/PlayerCamera";
import { elem } from "../elem";
import styles from "./Options.module.css";

const DEFAULT_FOV = 60;
const DEFAULT_SENSITIVITY = 0.4;
const DEFAULT_AMBIENT_LIGHT = 10;

export class Options {
	fov = DEFAULT_FOV;
	ambientLight = [DEFAULT_AMBIENT_LIGHT / 100, DEFAULT_AMBIENT_LIGHT / 100, DEFAULT_AMBIENT_LIGHT / 100] as const;

	#fovSlider = elem("input", { type: "range", min: "1", max: "179", name: "fov", value: `${this.fov}` });
	#fovValue = elem("input", { type: "number", min: "1", max: "179", name: "fov-value", value: `${this.fov}` });
	#sensitivitySlider = elem("input", { type: "range", min: "0", max: "2", step: "0.01", name: "sensitivity" });
	#sensitivityValue = elem("input", { type: "number", step: "0.01", name: "sensitivity-value" });
	#ambientSlider = elem("input", { type: "range", min: "0", max: "100", step: "1", name: "ambient-light" });
	#ambientValue = elem("input", { type: "number", step: "1", name: "ambient-light-value" });
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
		elem("div", {
			className: styles.slider,
			contents: [
				elem("div", { className: styles.label, textContent: "Ambient light" }),
				this.#ambientSlider,
				elem("div", {
					className: styles.input,
					contents: [this.#ambientValue, elem("span", { textContent: "%" })],
				}),
			],
		}),
		this.#resetBtn,
	];

	listen(camera: PlayerCamera) {
		this.#setFov(+(localStorage.getItem("cse125.2024.g1.options.fov") ?? 0), localStorage);
		this.#setSensitivity(camera, +(localStorage.getItem("cse125.2024.g1.options.sensitivity") ?? 0), localStorage);
		this.#setAmbientLight(+(localStorage.getItem("cse125.2024.g1.options.ambientLight") ?? 0), localStorage);

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

		this.#ambientSlider.addEventListener("input", () => {
			this.#setAmbientLight(+this.#ambientSlider.value, this.#ambientSlider);
		});
		this.#ambientValue.addEventListener("input", () => {
			this.#setAmbientLight(+this.#ambientValue.value, this.#ambientValue);
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
			localStorage.setItem("cse125.2024.g1.options.fov", fov === DEFAULT_FOV ? "" : `${fov}`);
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
			localStorage.setItem(
				"cse125.2024.g1.options.sensitivity",
				sensitivity === DEFAULT_SENSITIVITY ? "" : `${sensitivity}`,
			);
		}
		if (source !== this.#sensitivitySlider) {
			this.#sensitivitySlider.value = `${sensitivity}`;
		}
		if (source !== this.#sensitivityValue) {
			this.#sensitivityValue.value = `${sensitivity}`;
		}
	}

	#setAmbientLight(ambientLight?: number, source?: unknown) {
		ambientLight ||= DEFAULT_AMBIENT_LIGHT;
		this.ambientLight = [ambientLight / 100, ambientLight / 100, ambientLight / 100];
		if (source !== localStorage) {
			localStorage.setItem(
				"cse125.2024.g1.options.ambientLight",
				ambientLight === DEFAULT_AMBIENT_LIGHT ? "" : `${ambientLight}`,
			);
		}
		if (source !== this.#ambientSlider) {
			this.#ambientSlider.value = `${ambientLight}`;
		}
		if (source !== this.#ambientValue) {
			this.#ambientValue.value = `${ambientLight}`;
		}
	}
}
