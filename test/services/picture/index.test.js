'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('picture service', function() {
  it('registered the pictures service', () => {
    assert.ok(app.service('pictures'));
  });
});
