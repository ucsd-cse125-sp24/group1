export class Connection<ReceiveType, SendType> {
	#ws: WebSocket;
	#indicator?: HTMLElement | null;
	#lastTime = performance.now();
	#wsError = false;
	handleMessage: (data: ReceiveType) => SendType | undefined;

	constructor(url: string, handleMessage: (data: ReceiveType) => SendType | undefined, indicator?: HTMLElement | null) {
		this.#indicator = indicator;
		if (indicator) {
			indicator.textContent = "🤔 Connecting...";
		}
		this.handleMessage = handleMessage;

		try {
			this.#ws = new WebSocket(url);
			this.#ws.addEventListener("open", this.#handleOpen);
			this.#ws.addEventListener("message", this.#handleRawMessage);
			this.#ws.addEventListener("error", this.#handleError);
			this.#ws.addEventListener("close", this.#handleClose);
		} catch (error) {
			if (indicator) {
				indicator.textContent = "❌ Failed to open connection";
			}
			throw error;
		}
	}

	#handleOpen = () => {
		console.log("Connected :D");
		if (this.#indicator) {
			this.#indicator.textContent = "✅ Connected";
			this.#lastTime = performance.now();
		}
	};

	#handleRawMessage = (e: MessageEvent<unknown>) => {
		let data: ReceiveType;
		try {
			if (typeof e.data !== "string") {
				throw new TypeError("Data is not string");
			}
			data = JSON.parse(e.data);
		} catch (error) {
			console.warn("Parsing JSON message failed!");
			console.log(`Received Data: \n${e.data}`);
			throw error;
		}

		const response = this.handleMessage(data);
		if (response) {
			this.send(response);
		}

		if (this.#indicator) {
			const now = performance.now();
			this.#indicator.textContent = `✅ Connected (${(now - this.#lastTime).toFixed(3)}ms roundtrip)`;
			this.#lastTime = now;
		}
	};

	#handleError = () => {
		console.log("WebSocket error :(");
		if (this.#indicator) {
			this.#indicator.textContent = "❌ Failed to connect";
		}
		this.#wsError = true;
	};

	#handleClose = ({ code, reason, wasClean }: CloseEvent) => {
		console.log("Connection closed", { code, reason, wasClean });
		if (this.#indicator && !this.#wsError) {
			this.#indicator.textContent = "⛔ Connection closed";
		}
	};

	send(message: SendType): void {
		this.#ws.send(JSON.stringify(message));
	}
}
