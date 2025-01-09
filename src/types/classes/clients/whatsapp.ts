export interface IWhatsappClient {
    /**
     * Initializes the WhatsApp client and establishes a connection.
     * Automatically called after dependencies are resolved via Inversify.
     * @returns A promise that resolves when the client is ready.
     */
    init(): Promise<void>;
}
