import { wss } from './server';

const PORT = process.env.PORT || 5000;

export default async function startSocket() {
  try {
    wss.on('connection', async function (socket) {
      console.log('Connected');
      socket.send('Client connected');
      socket.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          if (parsedMessage.method) {
            socket.send(parsedMessage.method);
          } else {
            socket.send('Please provide valid method name');
          }
        } catch (e: any) {
          if (e.message.includes('JSON'))
            socket.send('Please provide valid method ');
          else socket.send(e.message);
        }
      });

      // Ping Pong
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();
          console.log('Ping sent');
        }
      }, 30000);

      socket.on('pong', () => {
        console.log('Pong received');
      });

      socket.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
      });
    });
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  } catch (e: any) {
    console.log('Error in WebSocket connection', e.message);
  }
}
