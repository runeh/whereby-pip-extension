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

interface SourceLocation {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getSourceLocation(
  video: HTMLVideoElement,
  layout: LayoutBox,
): SourceLocation {
  const inputAspectRatio = video.videoWidth / video.videoHeight;
  const outputAspectRatio = layout.width / layout.height;

  if (inputAspectRatio === outputAspectRatio) {
    return { y: 0, x: 0, w: video.videoWidth, h: video.videoHeight };
  } else if (inputAspectRatio > outputAspectRatio) {
    const y = 0;
    const h = layout.height;
    const w = layout.width / inputAspectRatio;
    const x = layout.width / 2 - w / 2;
    return { x, y, w, h };
  } else if (inputAspectRatio < outputAspectRatio) {
    const x = 0;
    const w = layout.width;
    const h = layout.height * inputAspectRatio;
    const y = layout.height / 2 - h / 2;
    return { x, y, w, h };
  }
  return null as never;
}
