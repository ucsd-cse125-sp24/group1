export type SoundObject = {
	audio: HTMLAudioElement;
	track: MediaElementAudioSourceNode;
	panner: PannerNode;
};

/**
 * Plays sounds. Permits playing multiple instances of the same sound, and
 * recycles `Audio` objects.
 *
 * Code taken from https://nolanchai.dev/Commit-Challenge-2024/spamsound.html
 */
export class SoundManager {
	#audio: Record<string, SoundObject[]> = {};
	#context: AudioContext;
	#destination: AudioNode;

	constructor(context: AudioContext, destination: AudioNode = context.destination) {
		this.#context = context;
		this.#destination = destination;
	}

	play(src: string): SoundObject {
		this.#audio[src] ??= [];
		const sound = this.#audio[src].pop();
		if (sound) {
			sound.audio.currentTime = 0;
			sound.audio.play().catch(() => {});
			return sound;
		} else {
			const audio = new Audio(src);
			const panner = new PannerNode(this.#context, {
				panningModel: "HRTF",
				distanceModel: "inverse",
			});
			const track = this.#context.createMediaElementSource(audio);

			audio.play().catch(() => {});
			audio.addEventListener("ended", () => {
				this.#audio[src].push({ audio, track, panner });
			});

			track.connect(panner).connect(this.#destination);

			return { audio, track, panner };
		}
	}
}
