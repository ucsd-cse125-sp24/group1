export interface Connection<SendType> {
	id: string;
	send(data: SendType): void;
}

export type ServerHandlers<ReceiveType, SendType> = {
	/**
	 * Handle a new connection and decide what messages to send to it.
	 */
	handleOpen?: (conn: Connection<SendType>) => void;
	/**
	 * Handles a message sent from the client, and decides what to reply with. It
	 * can return `undefined` to not send back anything.
	 */
	handleMessage?: (data: ReceiveType, conn: Connection<SendType>) => void;
};

/**
 * Defines the interface of a websocket server. Feel free to add any methods you
 * need here.
 *
 * Having an abstract class allows us to swap out the websocket server with a
 * web worker that runs in the client. See the `WebWorker` class for why we're
 * doing that.
 */
export abstract class Server<ReceiveType, SendType> {
	#handlers: ServerHandlers<ReceiveType, SendType>;

	/**
	 * A promise that resolves when there's a connection.
	 *
	 * It's used to pause the server when no one is connected by having it wait
	 * for this promise to resolve before continuing.
	 */
	abstract hasConnection: Promise<void>;

	constructor(handlers: ServerHandlers<ReceiveType, SendType> = {}) {
		this.#handlers = handlers;
	}

	/**
	 * Why the level of indirection? This is just to mirror `handleMessage` (below) for consistency.
	 */
	handleOpen(conn: Connection<SendType>): void {
		this.#handlers.handleOpen?.(conn);
	}

	/**
	 * Parses the message as JSON and calls the `handleMessage` handler.
	 */
	handleMessage(rawData: unknown, conn: Connection<SendType>): void {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ReceiveType;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		this.#handlers.handleMessage?.(data, conn);
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
