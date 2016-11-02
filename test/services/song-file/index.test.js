'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('song-file service', function() {
  it('registered the song-files service', () => {
    assert.ok(app.service('song-files'));
  });
});
