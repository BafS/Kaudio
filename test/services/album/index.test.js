'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('album service', function() {
  it('registered the albums service', () => {
    assert.ok(app.service('albums'));
  });
});
