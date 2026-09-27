const { randomUUID } = require('node:crypto');
const pinoHttp = require('pino-http');
const logger = require('../config/logger');

function createRequestLogger(loggerInstance = logger) {
  return pinoHttp({
    logger: loggerInstance,
    genReqId(req, res) {
      const incomingId = req.headers['x-request-id'];
      const requestId = typeof incomingId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(incomingId)
        ? incomingId
        : randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req(req) {
        const url = req.originalUrl || req.url || '/';
        return {
          id: req.id,
          method: req.method,
          url: url.split('?')[0].slice(0, 2048),
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  });
}

module.exports = createRequestLogger;