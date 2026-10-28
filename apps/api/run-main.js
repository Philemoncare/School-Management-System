require('dotenv').config();
console.log('Starting run-main.js...');
try {
  require('./dist/src/main.js');
} catch (err) {
  console.error('CRASH ERROR:', err);
}
