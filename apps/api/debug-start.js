const fs = require('fs');
const logFile = 'debug.log';
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[DEBUG ${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  fs.writeSync(1, line);
}

log('Starting debug script...');

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason?.stack || reason}`);
});

log('Loading dotenv...');
require('dotenv/config');

log('Requiring NestFactory...');
const { NestFactory } = require('@nestjs/core');

log('Requiring AppModule...');
const { AppModule } = require('./dist/src/app.module');

async function test() {
  log('Calling NestFactory.create...');
  try {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    log('NestFactory.create completed successfully!');

    app.setGlobalPrefix('api/v1');
    log('Calling app.listen(4000)...');
    await app.listen(4000);
    log('SUCCESS! App listening on http://localhost:4000/api/v1');
  } catch (err) {
    log(`ERROR in test(): ${err.stack || err}`);
  }
}

test();
