export interface Connection<SendType> {
	id: string;
	send(data: SendType): void;
}

export type ServerHandlers<ReceiveType, SendType> = {
	/**
	 * Handle a new connection and decide what messages to send to it.
	 */
	handlePlayerJoin: (conn: Connection<SendType>, name?: string) => void;
	/**
	 * Handle a connection that has disconnected.
	 */
	handlePlayerDisconnect: (id: string) => void;
	/**
	 * Handles a message sent from the client, and decides what to reply with. It
	 * can return `undefined` to not send back anything.
	 */
	handleMessage: (data: ReceiveType, conn: Connection<SendType>) => void;
};

/**
 * Defines the interface of a websocket server. Feel free to add any methods you
 * need here.
 *
 * Having an abstract class allows us to swap out the websocket server with a
 * web worker that runs in the client. See the `WebWorker` class for why we're
 * doing that.
 */
export interface Server<ReceiveType, SendType> {
	/**
	 * A promise that resolves when there's a connection.
	 *
	 * It's used to pause the server when no one is connected by having it wait
	 * for this promise to resolve before continuing.
	 */
	hasConnection: Promise<void>;

	/**
	 * Send a message to all clients.
	 */
	broadcast(message: SendType): void;

	/**
	 * Start the server.
	 */
	listen(port: number): void;
}
