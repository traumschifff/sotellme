// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const { Server } = require('ws');
const OpenAI = require('openai');
const path = require('path');

// Initialize OpenAI API
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

// Initialize Express and WebSocket
const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory

// Set up CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// New route to display conversation
app.get('/transcript', (req, res) => {
    let conversationText = '';
    conversationHistory.forEach(message => {
        const { role, content } = message;
        conversationText += `${role}: ${content}\n`;
    });
    res.setHeader('Content-Type', 'text/plain');
    res.send(conversationText);
});

// Serve static HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'guide.html'));
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port}`);
});

const wss = new Server({ server });

// Keep track of all connected clients
const clients = new Set();

// System message, adjust this to your needs
const systemMessage = 'You are now in a role play. In this role play, I am a guide in a psychoanalytic session. You are the client, whose unconscious patterns are the subject of this therapy session. Your answers are not longer than 5 sentences.';

let conversationHistory = [];

wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');
    clients.add(ws);

    ws.on('message', async (message) => {
        // Convert the Buffer to a string
        const messageStr = message.toString();
        
        console.log(`Received: ${messageStr}`);

        // Add user message to conversation history
        conversationHistory.push({ role: 'user', content: messageStr });

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                max_tokens: 100,
                messages: [
                    { role: 'system', content: systemMessage },
                    ...conversationHistory
                ]
            });

            const responseContent = completion.choices[0].message.content.trim();

            console.log(`Sending: ${responseContent}`);

            // Add the assistant's message to the conversation history
            conversationHistory.push({ role: 'assistant', content: responseContent });

            // Send the response to all connected clients
            for (const client of clients) {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(responseContent));
                }
            }
        } catch (error) {
            console.error(`Error: ${error}`);
            ws.send('An error occurred.');
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});