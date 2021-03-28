import { ErrorResponse } from './errorResponse';

describe('ErrorResponse', () => {
  it('should serialize the message', () => {
    expect(new ErrorResponse('ERR-000', 'reason', '321').serialize()).toBe(
      '{"errorCode":"ERR-000","reason":"reason","correlationId":"321"}',
    );
  });
});
