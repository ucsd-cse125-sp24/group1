export function displayError(error: unknown): string {
	if (error instanceof Error) {
		return error.stack ?? `${error.name}: ${error.message}`;
	}
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

/**
 * Listens for errors and displays them on screen when they happen.
 *
 * @returns A function you can use to report errors.
 */
export function listenErrors(errorWindow: HTMLDialogElement): (error: unknown) => void {
	let visible = false;
	const log = document.createElement("pre");
	function handleError(error: unknown) {
		log.textContent += displayError(error) + "\n";
		if (!visible) {
			// visible = true;
			// errorWindow.append(log);
			// errorWindow.showModal();
		}
	}

	window.addEventListener("error", (e) => {
		handleError(e.error);
	});
	window.addEventListener("unhandledrejection", (e) => {
		handleError(e.reason);
	});

	return handleError;
}
