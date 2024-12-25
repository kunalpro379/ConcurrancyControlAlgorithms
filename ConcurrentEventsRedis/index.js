const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const redis = new Redis();
const EVENT_LOCK_KEY = "current_event_lock";

io.on('connection', (socket) => {
  console.log('New controller connected:', socket.id);

  socket.on('event', async (event) => {
    const lockAcquired = await acquiredLock(EVENT_LOCK_KEY);
    if (lockAcquired) {
      console.log('Lock acquired by controller:', socket.id);
      io.emit('block_cursor', {
        controllerId: socket.id
      });
      handleEvent(event, socket.id);
    } else {
      console.log('Event discarded from controller:', socket.id);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Controller disconnected:', socket.id, 'Reason:', reason);
  });
});

async function acquiredLock(key) {
  const result = await redis.set(key, 'locked', 'NX', 'EX', 4); // Lock for 4 seconds
  console.log('Lock acquisition result:', result);
  return result === 'OK';
}

async function releaseLock(key) {
  await redis.del(key);
  console.log('Lock released');
}

async function handleEvent(event, controllerId) {
  console.log(`Processing event from controller ${controllerId}:`, event);
  // Simulate event processing time
  setTimeout(async () => {
    await releaseLock(EVENT_LOCK_KEY);
    io.emit('unblock_cursor', { controllerId });
  }, 4000);
}

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
