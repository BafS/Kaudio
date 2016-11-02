'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('person service', function() {
  it('registered the people service', () => {
    assert.ok(app.service('people'));
  });
});
