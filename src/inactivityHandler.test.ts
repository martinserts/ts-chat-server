import { createInactivityHandler, InactivityHandler } from './inactivityHandler';

describe('inactivityHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    inactivityHandler = createInactivityHandler(action, inactivityTimeout);
  });

  const inactivityTimeout = 1000;
  const action = jest.fn();
  let inactivityHandler: InactivityHandler;

  describe('enabled', () => {
    it('should do nothing if we enable enabled handler once more', () => {
      inactivityHandler.enabled = true;
      inactivityHandler.enabled = true;
      expect(inactivityHandler.enabled).toBeTruthy();
    });

    it('should do nothing if we disable disabled handler once more', () => {
      inactivityHandler.enabled = true;
      inactivityHandler.enabled = false;
      inactivityHandler.enabled = false;
      expect(clearTimeout).toBeCalledTimes(1);
    });

    it('should turn on the timer', () => {
      expect(setTimeout).not.toBeCalled();

      inactivityHandler.enabled = true;
      expect(inactivityHandler.enabled).toBeTruthy();
      expect(setTimeout).toBeCalled();
      expect(action).not.toBeCalled();

      jest.advanceTimersByTime(inactivityTimeout);
      expect(action).toBeCalled();
    });

    it('should turn off the timer', () => {
      expect(clearTimeout).not.toBeCalled();

      inactivityHandler.enabled = true;
      inactivityHandler.enabled = false;
      expect(inactivityHandler.enabled).toBeFalsy();

      expect(clearTimeout).toBeCalled();

      jest.advanceTimersByTime(inactivityTimeout);
      expect(action).not.toBeCalled();
    });
  });

  describe('restart', () => {
    it('should reset the timer', () => {
      inactivityHandler.enabled = true;

      jest.advanceTimersByTime(inactivityTimeout - 1);
      expect(action).not.toBeCalled();
      expect(clearTimeout).not.toBeCalled();

      inactivityHandler.restart();
      expect(clearTimeout).toBeCalled();

      jest.advanceTimersByTime(inactivityTimeout - 1);
      expect(action).not.toBeCalled();

      jest.advanceTimersByTime(inactivityTimeout);
      expect(action).toBeCalled();
    });
  });
});
