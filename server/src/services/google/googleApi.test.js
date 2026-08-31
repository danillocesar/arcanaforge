const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { classifyTokenError, classifyCalendarError } = require('./googleApi');

describe('classifyTokenError', () => {
  it('returns "auth" for invalid_grant (per-user credential failure)', () => {
    const result = classifyTokenError(400, { error: 'invalid_grant' });
    assert.equal(result, 'auth');
  });

  it('returns "other" for invalid_client (config error, not per-user)', () => {
    const result = classifyTokenError(401, { error: 'invalid_client' });
    assert.equal(result, 'other');
  });

  it('returns "other" for invalid_request', () => {
    const result = classifyTokenError(400, { error: 'invalid_request' });
    assert.equal(result, 'other');
  });

  it('returns "other" for unauthorized_client', () => {
    const result = classifyTokenError(401, { error: 'unauthorized_client' });
    assert.equal(result, 'other');
  });

  it('returns "other" for empty body with 500', () => {
    const result = classifyTokenError(500, {});
    assert.equal(result, 'other');
  });

  it('returns "other" for null body', () => {
    const result = classifyTokenError(500, null);
    assert.equal(result, 'other');
  });
});

describe('classifyCalendarError', () => {
  it('returns "auth" for 401 (credencial inválida)', () => {
    const result = classifyCalendarError(401, {});
    assert.equal(result, 'auth');
  });

  it('returns "transient" for 403 with rateLimitExceeded', () => {
    const body = { error: { errors: [{ reason: 'rateLimitExceeded' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'transient');
  });

  it('returns "transient" for 403 with userRateLimitExceeded', () => {
    const body = { error: { errors: [{ reason: 'userRateLimitExceeded' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'transient');
  });

  it('returns "transient" for 403 with quotaExceeded', () => {
    const body = { error: { errors: [{ reason: 'quotaExceeded' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'transient');
  });

  it('returns "transient" for 403 with backendError', () => {
    const body = { error: { errors: [{ reason: 'backendError' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'transient');
  });

  it('returns "auth" for 403 with forbidden (not transient)', () => {
    const body = { error: { errors: [{ reason: 'forbidden' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'auth');
  });

  it('returns "auth" for 403 with insufficientPermissions', () => {
    const body = { error: { errors: [{ reason: 'insufficientPermissions' }] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'auth');
  });

  it('returns "auth" for 403 with no errors array', () => {
    const body = { error: { message: 'Forbidden' } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'auth');
  });

  it('returns "auth" for 403 with empty errors array', () => {
    const body = { error: { errors: [] } };
    const result = classifyCalendarError(403, body);
    assert.equal(result, 'auth');
  });

  it('returns "other" for 404 (the caller decides significance)', () => {
    const result = classifyCalendarError(404, {});
    assert.equal(result, 'other');
  });

  it('returns "other" for 500', () => {
    const result = classifyCalendarError(500, {});
    assert.equal(result, 'other');
  });

  it('returns "other" for null/undefined body', () => {
    assert.equal(classifyCalendarError(404, null), 'other');
    assert.equal(classifyCalendarError(404, undefined), 'other');
  });
});
