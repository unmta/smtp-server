import { beforeAll, afterAll } from 'bun:test';
import { SmtpServer } from '../lib/SmtpServer';

// Start the SMTP server
const server = new SmtpServer();

beforeAll(async () => {
  server.start();
});

// afterAll(() => {
//   // Stop the server after tests
//   SmtpResponse.stop();
// });
