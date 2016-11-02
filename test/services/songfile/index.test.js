'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('songfile service', function() {
  it('registered the songfiles service', () => {
    assert.ok(app.service('songfiles'));
  });
});
