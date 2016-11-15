'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('audio service', function() {
  it('registered the audios service', () => {
    assert.ok(app.service('audios'));
  });
});
