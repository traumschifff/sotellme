// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const { Server } = require('ws');
const OpenAI = require('openai');

// Initialize OpenAI API
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

// Initialize Express and WebSocket
const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory

const server = app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

const wss = new Server({ server });

// Keep track of all connected clients
const clients = new Set();

// System message, adjust this to your needs
const systemMessage = 'You are a pateint undergoing psychoanalytic therapy.';

let conversationHistory = [];

wss.on('connection', (ws) => {
    console.log("WebSocket connection established.");

    ws.on('message', async (message) => {
        console.log(`Received: ${message}`);

        let messageAsString = String(message);

        // Add user message to conversation history
        conversationHistory.push({ role: 'user', content: messageAsString });

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemMessage
                    },
                    ...conversationHistory
                ]
            });

            console.log(completion.choices[0].message.content.trim());

            // Add the assistant's message to the conversation history
            conversationHistory.push({ role: 'assistant', content: completion.choices[0].message.content.trim() });

            // Send back the assistant's reply
            ws.send(JSON.stringify(completion.choices[0].message.content.trim()));


        } catch (error) {
            console.error(`Error: ${error}`);
            ws.send('An error occurred.');
        }
    });
});
