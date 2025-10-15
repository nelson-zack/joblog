import mockJobs from '../mock/jobs.sample.json';
import { createStore } from './store';
import { createApiDriver } from './driver-api';
import { createLocalDriver } from './driver-local';
import { createDemoDriver } from './driver-demo';

export const MODES = {
  ADMIN: 'admin',
  LOCAL: 'local',
  DEMO: 'demo'
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export const createStoreForMode = ({ mode, apiKey, seedJobs }) => {
  switch (mode) {
    case MODES.ADMIN: {
      const driver = createApiDriver({ apiKey });
      return createStore(driver);
    }
    case MODES.LOCAL: {
      const driver = createLocalDriver();
      return createStore(driver);
    }
    case MODES.DEMO:
    default: {
      const driver = createDemoDriver({
        seed: clone(seedJobs ?? mockJobs)
      });
      return createStore(driver);
    }
  }
};
