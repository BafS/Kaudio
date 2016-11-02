'use strict';

const assert = require('assert');
const serve = require('../../../../src\services\songfile\hooks\serve.js');

describe('songfile serve hook', function() {
  it('hook can be used', function() {
    const mockHook = {
      type: 'after',
      app: {},
      params: {},
      result: {},
      data: {}
    };

    serve()(mockHook);

    assert.ok(mockHook.serve);
  });
});
