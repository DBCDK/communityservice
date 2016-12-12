var babel = require('babel-core');

module.exports = function(wallaby) {
  return {
    files: [
      'package.json',
      'src/**/*.js',
      '!src/**/*.test.js'
    ],

    tests: [
      'src/**/*.test.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: babel,
        plugins: [
          'transform-es2015-modules-commonjs',
          'transform-async-to-generator',
          'transform-class-properties'
        ]
      })
    },

    env: {
      type: 'node',
      runner: 'node',
      params: {
        env: // @see https://wallabyjs.com/docs/config/runner.html
        'PORT=3011;' +
        'HASH_SHARED=test-me-hash-shared;' +
        'MOCK_TICKET_STORAGE=1;' +
        'MOCK_CONSENT_STORAGE=1;' +
        'MOCK_SESSION_STORAGE=1;' +
        'MOCK_CULR=1;' +
        'MOCK_BORCHK=1;' +
        'MOCK_NEMLOGIN=1;' +
        'MOCK_OPENAGENCY=1;' +
        'MOCK_SMAUG=1;' +
        'MOCK_WAYF=1;' +
        'MOCK_UNILOGIN=1;' +
        'LOG_LEVEL=OFF;'
      }
    },

    testFramework: 'mocha@2.1.0'
  };
};
