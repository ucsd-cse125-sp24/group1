import { ServerControlMessage, ClientControlMessage, ServerMessage, ClientMessage } from "../../common/messages";
import { NAME_KEY } from "../ui/components/NamePrompt";

const CONNECTION_ID = "connection-id";

export class Connection {
	static MAX_RECONNECT_ATTEMPTS = 3;

	url: string;
	handleMessage: (data: ServerMessage) => ClientMessage | undefined;

	#ws: WebSocket | null = null;
	#worker: Worker | null = null;

	#lastPingTime = Date.now();
	#pingInterval = -1;

	#wsError = false;

	#sendQueue: (ClientMessage | ClientControlMessage)[] = [];
	#reconnectAttempts = Connection.MAX_RECONNECT_ATTEMPTS;

	#indicator?: HTMLElement | null;
	#workerBtn = Object.assign(document.createElement("button"), { textContent: "Use worker" });
	#retryBtn = Object.assign(document.createElement("button"), { textContent: "Reconnect" });

	constructor(
		url: string,
		handleMessage: (data: ServerMessage) => ClientMessage | undefined,
		indicator?: HTMLElement | null,
	) {
		this.url = url;
		this.#indicator = indicator;
		this.handleMessage = handleMessage;

		this.#workerBtn.addEventListener("click", this.#connectWorker);
		this.#retryBtn.addEventListener("click", () => this.connect(true));
		document.addEventListener("keydown", (e) => {
			if (e.key === "h") {
				this.#ws?.close();
			}
		});
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
			this.#ws.addEventListener("open", this.#handleWsOpen);
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

	#handleWsOpen = () => {
		console.log("Connected :D");
		this.#reconnectAttempts = Connection.MAX_RECONNECT_ATTEMPTS;
		if (this.#indicator) {
			this.#indicator.textContent = "✅ Connected";
			this.#pingInterval = window.setInterval(() => {
				this.#lastPingTime = Date.now();
				this.send({ type: "ping" });
			}, 1000);
		}

		this.#handleOpen();

		const queue = this.#sendQueue;
		this.#sendQueue = [];
		for (const message of queue) {
			this.send(message);
		}
	};

	#handleOpen() {
		let old_connection = localStorage.getItem(CONNECTION_ID);
		this.send({ type: "join", id: old_connection ?? "", name: localStorage.getItem(NAME_KEY) ?? undefined });
	}

	#handleRawMessage = async (e: MessageEvent<unknown>) => {
		let data: ServerMessage | ServerControlMessage;
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

		switch (data.type) {
			case "pong":
				if (this.#indicator) {
					const now = Date.now();
					const upload = data.time - this.#lastPingTime;
					const download = now - data.time;
					this.#indicator.textContent = `✅ Connected (${now - this.#lastPingTime}ms roundtrip, ${upload}ms upload, ${download}ms download)`;
				}
				return;
			case "join-response":
				console.log(data);
				localStorage.setItem(CONNECTION_ID, data.id);
				return;
		}

		const response = this.handleMessage(data);
		if (response) {
			this.send(response);
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
		}
		this.#ws = null;
		this.#wsError = true;
	};

	#handleClose = ({ code, reason, wasClean }: CloseEvent) => {
		console.log("Connection closed", { code, reason, wasClean });
		if (this.#indicator && !this.#wsError) {
			this.#indicator.textContent = "⛔ Connection closed. ";
		}
		clearInterval(this.#pingInterval);
		this.#ws = null;
		// Try to reconnect
		if (this.#reconnectAttempts > 0) {
			this.#reconnectAttempts--;
			this.connect();
		} else if (this.#indicator) {
			this.#indicator.append(this.#retryBtn);
		}
	};

	send(message: ClientMessage | ClientControlMessage): void {
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
		this.#handleOpen();
	};
}
