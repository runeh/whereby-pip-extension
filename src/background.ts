chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
  chrome.declarativeContent.onPageChanged.addRules([
    {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: 'whereby.com' },
          css: ['[class|=ConnectedRoom]'],
        }),
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()],
    },
  ]);
});

chrome.pageAction.onClicked.addListener((a) => {
  // todo: inject here?
  // chrome.tabs.executeScript({ file: './lol.ts' }, (res) => {
  //   console.log('executer result', res);
  // });
  console.log('in');
  chrome.tabs.sendMessage(a.id, 'toggle-pip');
});
