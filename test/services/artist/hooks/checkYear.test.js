'use strict';

const assert = require('assert');
const checkYear = require('../../../../src\services\artist\hooks\checkYear.js');

describe('artist checkYear hook', function() {
  it('hook can be used', function() {
    const mockHook = {
      type: 'before',
      app: {},
      params: {},
      result: {},
      data: {}
    };

    checkYear()(mockHook);

    assert.ok(mockHook.checkYear);
  });
});
