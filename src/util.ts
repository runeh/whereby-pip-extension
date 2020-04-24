import { Options } from './types';

const defaultOptions: Options = {
  flipSelf: false,
  frameRate: 30,
  keepAspectRatio: true,
  showMuteIndicator: true,
  showNames: false,
  showOwnVideo: true,
  videoResolution: {
    width: 1280,
    height: 800,
  },
};

export function loadOptions(): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultOptions, (opts: Options) => resolve(opts));
  });
}

export function saveOptions(opts: Options): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(opts, () => {
      resolve(opts);
    });
  });
}
