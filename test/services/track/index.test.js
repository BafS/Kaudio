'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('track service', function() {
  it('registered the tracks service', () => {
    assert.ok(app.service('tracks'));
  });
});
