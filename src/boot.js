const { runHookApp } = require('@forrestjs/hooks');
const envalid = require('envalid');

// Services
const serviceEnv = require('@forrestjs/service-env');
const serviceLogger = require('@forrestjs/service-logger');

// Features
const serviceLoggerConfig = require('./service-logger-config');
const featureVacuum = require('./feature-vacuum');

const env = envalid.cleanEnv(process.env, {
  LOG_LEVEL: envalid.str({
    default: 'info',
    choices: [
      'emerg',
      'alert',
      'crit',
      'error',
      'warning',
      'notice',
      'info',
      'verbose',
      'debug',
      'silly',
    ],
  }),
  VACUUM_DELAY: envalid.num({ default: 0 }),
  VACUUM_INTERVAL: envalid.num({ default: 600000 }),
  VACUUM_RULES: envalid.json({
    default: '[{ "match": "(.*)", "retain": 0 }]',
  }),
  VACUUM_SYSTEM_PRUNE: envalid.bool({ default: false }),
  VACUUM_SYSTEM_PRUNE_VOLUMES: envalid.bool({ default: false }),
});

runHookApp({
  settings: {
    logger: {
      level: env.LOG_LEVEL,
    },
    vacuum: {
      delay: env.VACUUM_DELAY,
      interval: env.VACUUM_INTERVAL,
      rules: env.VACUUM_RULES,
      prune: {
        enabled: env.VACUUM_SYSTEM_PRUNE,
        volumes: env.VACUUM_SYSTEM_PRUNE_VOLUMES,
      },
    },
  },
  trace: 'compact',
  services: [serviceEnv, serviceLoggerConfig, serviceLogger],
  features: [featureVacuum],
}).catch((err) => console.error(err.message));

// Let Docker exit on Ctrl+C
process.on('SIGINT', () => process.exit());
