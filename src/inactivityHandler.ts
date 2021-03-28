import * as IO from 'fp-ts/lib/IO';

export interface InactivityHandler {
  enabled: boolean;
  restart: IO.IO<void>;
}

class InactivityHandlerImpl implements InactivityHandler {
  action: IO.IO<void>;
  inactivityTimeout: number;
  timeout?: NodeJS.Timeout;

  constructor(action: IO.IO<void>, inactivityTimeout: number) {
    this.action = action;
    this.inactivityTimeout = inactivityTimeout;
  }

  get enabled() {
    return !!this.timeout;
  }

  set enabled(value) {
    if (value) this.start();
    else this.stop();
  }

  restart = () => {
    this.stop();
    this.start();
  };

  private start = () => {
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.action();
      }, this.inactivityTimeout);
    }
  };

  private stop = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  };
}

export const createInactivityHandler = (action: IO.IO<void>, inactivityTimeout: number): InactivityHandler =>
  new InactivityHandlerImpl(action, inactivityTimeout);
