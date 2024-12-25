const io = require('socket.io-client');

const socket = io('http://localhost:4000', {
  reconnectionAttempts: 5, // Try to reconnect up to 5 times
  timeout: 2000, // Timeout after 2 seconds if connection is not established
});
console.log('Client started');

function sendEvent(event) {
  console.log('Sending event:', event);
  socket.emit('event', event, (ack) => {
    if (ack && ack.error) {
      console.error('Error sending event:', ack.error);
    } else {
      console.log('Event sent successfully:', event);
    }
  });
}

socket.on('connect', () => {
  console.log('Connected to server');

  // Simulate batches of 50 events, each containing 5 simultaneous events
  for (let batch = 0; batch < 100; batch++) {
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        sendEvent({ type: 'click', data: { x: batch * 5 + i, y: batch * 5 + i } });
      }
    }, batch * 1000); // Delay each batch by 1 second
  }
});

socket.on('block_cursor', (data) => {
  console.log('Cursor is blocked by controller:', data.controllerId);
  console.log('Blocking cursor data:', data);
});

socket.on('unblock_cursor', (data) => {
  console.log('Cursor is unblocked by controller:', data.controllerId);
  console.log('Unblocking cursor data:', data);
});

// Add error handling
socket.on('connect_error', (err) => {
  if (err.code === 'parser error') {
    console.error('Parser error:', err);
  } else {
    console.error('Connection error:', err);
  }
});

socket.on('disconnect', (reason) => {
  console.warn('Disconnected from server:', reason);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

// Handle reconnection attempts
socket.on('reconnect_attempt', (attempt) => {
  console.log(`Reconnection attempt #${attempt}`);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed');
});