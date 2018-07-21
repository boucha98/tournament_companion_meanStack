import { MsnMeanTutoPage } from './app.po';

describe('msn-mean-tuto App', () => {
  let page: MsnMeanTutoPage;

  beforeEach(() => {
    page = new MsnMeanTutoPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
