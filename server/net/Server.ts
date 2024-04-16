export abstract class Server<ReceiveType, SendType> {
	handleMessage: (data: ReceiveType) => SendType | undefined;

	constructor(handleMessage: (data: ReceiveType) => SendType | undefined) {
		this.handleMessage = handleMessage;
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
