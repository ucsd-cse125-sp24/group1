/**
 * Plays sounds. Permits playing multiple instances of the same sound, and
 * recycles `Audio` objects.
 *
 * Code taken from https://nolanchai.dev/Commit-Challenge-2024/spamsound.html
 */
export class SoundManager {
	#audio: Record<string, HTMLAudioElement[]> = {};

	play(src: string): HTMLAudioElement {
		this.#audio[src] ??= [];
		const audio = this.#audio[src].pop();
		if (audio) {
			audio.currentTime = 0;
			audio.play();
			return audio;
		} else {
			const audio = new Audio();
			audio.src = src;
			audio.addEventListener("ended", () => {
				this.#audio[src].push(audio);
			});
			audio.play();
			return audio;
		}
	}
}
