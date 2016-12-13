export default {
  maxInstances: 10,
  capabilities: [
    // Mac
    {
      maxInstances: 2,
      browserName: 'chrome',
      platform: 'OS X 10.11',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    {
      maxInstances: 2,
      browserName: 'firefox',
      platform: 'OS X 10.11',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    {
      maxInstances: 2,
      browserName: 'safari',
      platform: 'OS X 10.11',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    // Windows
    {
      maxInstances: 2,
      browserName: 'chrome',
      platform: 'Windows 10',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    {
      maxInstances: 2,
      browserName: 'firefox',
      platform: 'Windows 10',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    {
      maxInstances: 2,
      browserName: 'MicrosoftEdge',
      platform: 'Windows 10',
      version: 'latest',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    }
  ]
};
