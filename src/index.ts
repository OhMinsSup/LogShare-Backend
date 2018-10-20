import * as http from 'http';
import * as dotenv from 'dotenv';
import Server from './server';
dotenv.config();

const { PORT } = process.env;

const port = normalizePort(PORT || 3000);
const server = http.createServer(Server.callback());

server.listen(port, () => {
  console.log(`HTTP Server running on port ${port} ✅`);
});

server.on('error', onError);

function normalizePort(val: number | string): number | string | boolean {
  const port: number = typeof val === 'string' ? parseInt(val, 10) : val;
  if (isNaN(port)) {
    return val;
  } else if (port >= 0) {
    return port;
  } else {
    return false;
  }
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'Pipe' + port : 'Port' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}
