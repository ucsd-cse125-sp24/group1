// A temporary logger that keeps track of events in public/log.txt

const file = import("node:fs/promises").then((fs) => fs.open("./public/log.txt", "w")).catch(() => null);

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
