// Minimal leveled logger over console. No dependency, no configuration.
// info/warn are silenced under NODE_ENV=test to keep test output readable;
// error always prints. Accepts the same printf-style arguments as console.
const isTest = () => process.env.NODE_ENV === 'test';

const logger = {
  info: (...args) => {
    if (!isTest()) console.log(...args);
  },
  warn: (...args) => {
    if (!isTest()) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

module.exports = logger;
