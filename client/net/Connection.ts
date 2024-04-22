export class Connection<ReceiveType, SendType> {
	static MAX_RECONNECT_ATTEMPTS = 3;

	url: string;
	#ws: WebSocket | null = null;
	#indicator?: HTMLElement | null;
	#lastTime = performance.now();
	#wsError = false;
	handleMessage: (data: ReceiveType) => SendType | undefined;
	#sendQueue: SendType[] = [];
	#reconnectAttempts = Connection.MAX_RECONNECT_ATTEMPTS;

	#worker: Worker | null = null;
	#workerBtn = Object.assign(document.createElement("button"), { textContent: "Use worker" });

	constructor(url: string, handleMessage: (data: ReceiveType) => SendType | undefined, indicator?: HTMLElement | null) {
		this.url = url;
		this.#indicator = indicator;
		this.handleMessage = handleMessage;

		this.#workerBtn.addEventListener("click", this.#connectWorker);
	}

	connect(reconnecting = false) {
		if (this.#ws) {
			throw new Error("connect() has already been called");
		}
		if (this.#indicator) {
			this.#indicator.textContent = reconnecting ? "🤔 Connecting..." : "🤔 Connection lost. Reconnecting...";
		}
		try {
			this.#ws = new WebSocket(this.url);
			this.#ws.addEventListener("open", this.#handleOpen);
			this.#ws.addEventListener("message", this.#handleRawMessage);
			this.#ws.addEventListener("error", this.#handleError);
			this.#ws.addEventListener("close", this.#handleClose);
		} catch (error) {
			if (this.#indicator) {
				this.#indicator.textContent = "❌ Failed to open connection";
			}
			throw error;
		}
	}

	#handleOpen = () => {
		console.log("Connected :D");
		this.#reconnectAttempts = Connection.MAX_RECONNECT_ATTEMPTS;
		if (this.#indicator) {
			this.#indicator.textContent = "✅ Connected";
			this.#lastTime = performance.now();
		}
		const queue = this.#sendQueue;
		this.#sendQueue = [];
		for (const message of queue) {
			this.send(message);
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
		// Automatically use Web Worker on GitHub Pages
		if (window.location.hostname.endsWith(".github.io")) {
			this.#connectWorker();
			return;
		}
		if (this.#indicator) {
			this.#indicator.textContent = "❌ Failed to connect. ";
			// Check if the worker file exists (npm run build doesn't build it by
			// default)
			fetch("./worker/index.js")
				.then((r) => r.ok)
				.catch(() => false)
				.then((ok) => {
					if (ok && this.#indicator) {
						this.#indicator.append(this.#workerBtn);
					}
				});
			this.#ws = null;
		}
		this.#wsError = true;
	};

	// TODO: Try to reconnect
	#handleClose = ({ code, reason, wasClean }: CloseEvent) => {
		console.log("Connection closed", { code, reason, wasClean });
		if (this.#indicator && !this.#wsError) {
			this.#indicator.textContent = "⛔ Connection closed";
		}
		this.#ws = null;
		this.#worker = null;
		// Try to reconnect
		if (this.#reconnectAttempts > 0) {
			this.#reconnectAttempts--;
			this.connect();
		}
	};

	send(message: SendType): void {
		if (this.#ws?.readyState === WebSocket.OPEN) {
			this.#ws.send(JSON.stringify(message));
		} else if (this.#worker) {
			this.#worker.postMessage(JSON.stringify(message));
		} else {
			this.#sendQueue.push(message);
		}
	}

	#connectWorker = () => {
		if (this.#worker) {
			return;
		}
		if (this.#indicator) {
			this.#indicator.textContent = "🤔 Creating worker...";
		}
		this.#worker = new Worker("./worker/index.js");
		this.#worker.addEventListener("message", this.#handleRawMessage);
	};
}
