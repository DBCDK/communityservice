import {assert} from 'chai';

describe('Testing frontpage', () => {
  it('It should display CommunityService in browser', () => {
    browser.url('/');
    assert.isTrue(browser.getText('body').includes('CommunityService'));
  });
});
