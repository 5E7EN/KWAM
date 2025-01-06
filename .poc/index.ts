import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

import { messagesHandler } from './handlers/messages';

// Configure auth storage method
const connectToDatabase = async () => {
    return await useMultiFileAuthState('auth_info_baileys');
};

// Connect to WhatsApp Web
async function connectToWhatsApp() {
    const { state, saveCreds } = await connectToDatabase();

    // Create a new socket
    const client = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });

    // Handle connection updates
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(
                'Connection closed due to ',
                lastDisconnect.error,
                ', reconnecting ',
                shouldReconnect
            );

            // Reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
        }
    });

    // Handle credential updates
    client.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    client.ev.on('messages.upsert', (args) => {
        messagesHandler({ client: client, ...args });
    });
}

// Initiate the connection
connectToWhatsApp();
