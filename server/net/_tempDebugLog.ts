// A temporary logger that keeps track of events in public/log.txt

import { displayError } from "../../client/lib/listenErrors";

const file = import("node:fs/promises").then((fs) => fs.open("./public/log2.txt", "w")).catch(() => null);

const encoder = new TextEncoder();
export function log(line: string) {
	file.then((file) => {
		file?.write(
			encoder.encode(
				`${new Date().toLocaleString("en-US", {
					weekday: "short",
					month: "short",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				})}: ${line}\n`,
			),
		);
	});
}

export let errorOccurred = false;
if (typeof process !== "undefined") {
	process.on("uncaughtException", (reason, p) => {
		console.error("uncaughtException", reason);
		log("Uncaught error:\n" + (reason.stack ?? String(reason)));
		errorOccurred = true;
	});
	process.on("unhandledRejection", (error) => {
		console.error("unhandledRejection", error);
		log("Unhandled promise rejection:\n" + displayError(error));
		errorOccurred = true;
	});
}
