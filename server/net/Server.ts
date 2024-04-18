/**
 * Defines the interface of a websocket server. Feel free to add any methods you
 * need here.
 *
 * Having an abstract class allows us to swap out the websocket server with a
 * web worker that runs in the client. See the `WebWorker` class for why we're
 * doing that.
 */
export abstract class Server<ReceiveType, SendType> {
	#handleMessage: (data: ReceiveType) => SendType | undefined;

	/**
	 * @param handleMessage Handles a message sent from the client, and decides
	 * what to reply with. It can return `undefined` to not send back anything.
	 */
	constructor(handleMessage: (data: ReceiveType) => SendType | undefined) {
		this.#handleMessage = handleMessage;
	}

	handleMessage(rawData: unknown): SendType | undefined {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ReceiveType;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		return this.#handleMessage(data);
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
