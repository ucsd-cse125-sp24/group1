export type ServerHandlers<ReceiveType, SendType> = {
	/**
	 * Handle a new connection and decide what messages to send to it.
	 */
	handleOpen?: (id: number) => SendType[];
	/**
	 * Handles a message sent from the client, and decides what to reply with. It
	 * can return `undefined` to not send back anything.
	 */
	handleMessage?: (data: ReceiveType, id: number) => SendType | undefined;
};

/**
 * Defines the interface of a websocket server. Feel free to add any methods you
 * need here.
 *
 * Having an abstract class allows us to swap out the websocket server with a
 * web worker that runs in the client. See the `WebWorker` class for why we're
 * doing that.
 */
export abstract class Server<ReceiveType, SendType, Connection extends {} = unknown & {}> {
	#handlers: ServerHandlers<ReceiveType, SendType>;
	#connectionIds = new WeakMap<Connection, number>();
	/** A promise that resolves when there's a connection */
	abstract hasConnection: Promise<void>;

	constructor(handlers: ServerHandlers<ReceiveType, SendType> = {}) {
		this.#handlers = handlers;
	}

	#nextId = 1;
	#getId(conn: Connection): number {
		const id = this.#connectionIds.get(conn);
		if (id) {
			return id;
		} else {
			const id = this.#nextId;
			this.#connectionIds.set(conn, id);
			this.#nextId++;
			return id;
		}
	}

	handleOpen(conn: Connection): SendType[] {
		return this.#handlers.handleOpen?.(this.#getId(conn)) ?? [];
	}

	handleMessage(rawData: unknown, conn: Connection): SendType | undefined {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ReceiveType;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		return this.#handlers.handleMessage?.(data, this.#getId(conn));
	}

	/**
	 * Send a message to all clients.
	 */
	abstract broadcast(message: SendType): void;

	/**
	 * Start the server.
	 */
	abstract listen(port: number): void;
}
