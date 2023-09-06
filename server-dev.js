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
      const responseContent = `The papaya ( Carica papaya ) is a plant in the family Caricaceae . The plant is closely related to the mountain papaya ( Vasconcellea cundinamarcensis , synonym: Carica pubescens ).

      In Belgium and the Netherlands, the papaya is imported from Central America , Asia , Central and South Africa . Papaya is now also grown in a greenhouse in the Netherlands. they also need special soil. There is little or no seasonality in the supply of papaya; the fruit is available all year round.
      
      The papaya is the fruit of a melon tree and is therefore called "tree melon". The fruits grow on the trunk of the tree. The papaya tree is native to Mexico. The tree can grow up to six meters high. The trunk is hollow, the leaves are large and finger-shaped. There are several subspecies of papayas.
      
      Leaf of a young papaya plant
      The fruit is round to oval, about 20 cm long. The weight of a papaya sold in Belgium or the Netherlands can vary from 300-500 g, although the fruits can weigh 6 kg. However, papayas of this weight are not exported. The papaya has a smooth, thin skin, which changes color from green to yellow-green mottled as it ripens. A ripe papaya has salmon-pink to yellow-orange flesh, smells somewhat like apricots , is buttery soft and tastes sweet and melon-like . The pulp of the papaya contains no fruit acids, resulting in a very sweet taste. In the middle of the papaya is a hollow space that is filled with black seeds, which are not eaten. The seeds can be dried and used as pepperwith certain dishes.
      
      In the tropics, the seeds are used as a medicine against intestinal parasites, because of the laxative effect. Immature specimens are eaten as a vegetable .
      
      The fruits must be harvested when the ripening process has just begun and papayas picked too early cannot ripen. They are vulnerable products for export.`

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
