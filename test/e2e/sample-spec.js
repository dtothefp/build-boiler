import {expect} from 'chai';
import setup from '../config/e2e-setup';

describe('#SampleSync not exporting ANY browsers', () => {
  const client = setup();
  const url = '/';

  before(() => {
    client.url(url);
  });

  it('should get the page title', () => {
    const title = client.getTitle();
    expect(title).to.eq('Build Boiler');
  });

  it('should get a div from the DOM', () => {
    const elm = client.element('body');
    expect(elm).to.not.be.null;
  });

  it('should fill in the inputs', () => {
    ['givenName', 'lastName', 'whatever'].forEach((fieldName) => {
      client.element(`[name="${fieldName}"]`).setValue(fieldName);
    });
  });
});
