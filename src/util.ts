import { Options } from './types';
import { LayoutBox } from './layout';

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

export function getSourceCrop(
  video: HTMLVideoElement,
  layout: LayoutBox,
): LayoutBox {
  const inputAspectRatio = video.videoWidth / video.videoHeight;
  const outputAspectRatio = layout.width / layout.height;

  if (inputAspectRatio === outputAspectRatio) {
    return {
      top: 0,
      left: 0,
      width: video.videoWidth,
      height: video.videoHeight,
    };
  } else if (inputAspectRatio > outputAspectRatio) {
    const top = 0;
    const height = layout.height;
    const width = layout.width / inputAspectRatio;
    const left = layout.width / 2 - width / 2;
    return { left, top, width, height };
  } else if (inputAspectRatio < outputAspectRatio) {
    const left = 0;
    const width = layout.width;
    const height = layout.height * inputAspectRatio;
    const top = layout.height / 2 - height / 2;
    return { left, top, width, height };
  }

  // fixme, have a helper that returns 'equal', 'greater', 'lesser' and swith?
  throw new Error('halp');
}
