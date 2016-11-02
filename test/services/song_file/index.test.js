'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('song_file service', function() {
  it('registered the song_files service', () => {
    assert.ok(app.service('song_files'));
  });
});
