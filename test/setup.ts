import { beforeAll, afterAll } from 'bun:test';
import { UnMtaServer } from '../lib/UnMtaServer';

// Start the SMTP server
const server = new UnMtaServer();

beforeAll(async () => {
  server.start();
});

// afterAll(() => {
//   // Stop the server after tests
//   UnMtaServer.stop();
// });
