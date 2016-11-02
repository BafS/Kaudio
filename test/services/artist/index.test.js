'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('artist service', function() {
  it('registered the artists service', () => {
    assert.ok(app.service('artists'));
  });
});
