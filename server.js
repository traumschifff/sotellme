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
const systemMessage = 'You are a patient undergoing psychoanalytic therapy.';

let conversationHistory = [];

wss.on('connection', (ws) => {
  console.log('WebSocket connection established.');
  clients.add(ws);

  ws.on('message', async (message) => {

    for (const client of clients) {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify("transmitting"));
        }
    }

    // Convert the Buffer to a string
    const messageStr = message.toString();
    
    console.log(`Received: ${messageStr}`);

    // Add user message to conversation history
    conversationHistory.push({ role: 'user', content: messageStr });

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

      const responseContent = completion.choices[0].message.content.trim();
      
      console.log(`Sending: ${responseContent}`);

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
