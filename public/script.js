document.addEventListener("DOMContentLoaded", () => {
    const ws = new WebSocket("ws://localhost:3000");
  
    ws.onopen = () => {
      console.log("WebSocket connection opened.");
    };
  
    ws.onmessage = (event) => {
      const outputDiv = document.getElementById("output");
      outputDiv.innerHTML = `Answer: ${event.data}`;
    };
  
    const sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", () => {
      const userInput = document.getElementById("userInput").value;
      ws.send(userInput);
    });
  });
  