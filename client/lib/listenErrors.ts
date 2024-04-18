/**
 * Listens for errors and displays them on screen when they happen.
 */
export function listenErrors(errorWindow: HTMLDialogElement) {
	function displayError(error: unknown): string {
		if (error instanceof Error) {
			return error.stack ?? `${error.name}: ${error.message}`;
		}
		try {
			return JSON.stringify(error);
		} catch {
			return String(error);
		}
	}

	let visible = false;
	const log = document.createElement("pre");
	function handleError(error: string) {
		log.textContent += error + "\n";
		if (!visible) {
			visible = true;
			errorWindow.append(log);
			errorWindow.showModal();
		}
	}

	window.addEventListener("error", (e) => {
		handleError(displayError(e.error));
	});
	window.addEventListener("unhandledrejection", (e) => {
		handleError(displayError(e.reason));
	});
}
