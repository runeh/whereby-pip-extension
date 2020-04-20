chrome.pageAction.onClicked.addListener((a) => {
  // todo: inject here?
  // chrome.tabs.executeScript({ file: './lol.ts' }, (res) => {
  //   console.log('executer result', res);
  // });

  chrome.tabs.sendMessage(a.id, 'toggle-pip');
});

// chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//   // Replace the current rules
//   chrome.declarativeContent.onPageChanged.addRules([
//     {
//       conditions: [
//         new chrome.declarativeContent.PageStateMatcher({
//           // pageUrl: { hostSuffix: 'whereby.com' },
//           css: ['[class|=ConnectedRoom]'],
//         }),
//       ],
//       actions: [new chrome.declarativeContent.ShowPageAction(),
//     },
//   ]);
// });
