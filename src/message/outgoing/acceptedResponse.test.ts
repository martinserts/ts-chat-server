import { AcceptedResponse } from './acceptedResponse';

describe('AcceptedResponse', () => {
  it('should serialize the message', () => {
    expect(new AcceptedResponse('321').serialize()).toBe('{"command":"Accepted","correlationId":"321"}');
  });
});
