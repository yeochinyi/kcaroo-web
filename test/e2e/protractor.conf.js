exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'app/js/override.js',
    'app/js/datastruct.js',
    'app/app.js',
    'test/unit/test.js',
    '*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:8000/app/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
