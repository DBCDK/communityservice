'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const logger = require('__/logging')({
  environment: 'developement',
  level: 'TRACE',
  pretty: 1,
  hostname: 'localhost'
});

describe('logging', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should throw Error when setInfo is called without any args', () => {
    assert.throws(logger.setInfo, Error);
  });

  it('should throw Error when setInfo is called with array args', () => {
    const func = () => {
      logger.setInfo([]);
    };
    assert.throws(func, Error);
  });

  it('should throw Error when setInfo is called with non-object args', () => {
    const func = () => {
      logger.setInfo('string');
    };
    assert.throws(func, Error);
  });

  it('should not throw when given an object as argument', () => {
    const func = () => {
      logger.setInfo({test: 'hest'});
    };
    assert.doesNotThrow(func, Error);
  });

  it('should set info field when argument is accepted', () => {
    logger.setInfo({test: 'hest'});
    const spy = sandbox.spy(console, 'log');
    logger.log.log('info', 'test message');
    assert.isTrue(spy.args.toString().includes('"test":"hest"'), 'Values set in setInfo method is present in log output');
  });

  it('should log a message on the INFO level', () => {
    const spy = sandbox.spy(console, 'log');

    const logMsg = 'this is a log message ';
    const level = 'INFO';
    logger.log.log('info', logMsg);
    const args = JSON.parse(spy.args);

    assert.equal(args.msg, logMsg);
    assert.equal(args.level, level);
  });

  it('should log a message on each of the levels specified', () => {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

    levels.forEach((level) => {
      const spy = sandbox.spy(console, 'log');
      const logMsg = `this is an ${level} messge`;
      const method = level.toLowerCase();
      logger.log[method](logMsg);
      let args = null;
      try {
        args = JSON.parse(spy.args);
      }
      catch (e) {
        console.error('Could not parse args', spy.args, level, logger.level); // eslint-disable-line no-console
      }

      assert.equal(args.msg, logMsg);
      assert.equal(args.level, level, `Log statement with ${level} was found`);
      sandbox.restore();
    });
  });

  it('should ignore lower level messages');

  it('should be able to not prettify');
});
