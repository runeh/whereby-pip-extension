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

// interface Coordinate {
//   x: number;
//   y: number;
// }

interface Size {
  w: number;
  h: number;
}

interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getSourceCrop(source: Size, destination: Size): Crop {
  const inputAspectRatio = source.w / source.h;
  const outputAspectRatio = destination.w / destination.h;

  if (inputAspectRatio === outputAspectRatio) {
    return { x: 0, y: 0, w: source.w, h: source.h };
  } else if (inputAspectRatio > outputAspectRatio) {
    const y = 0;
    const h = source.h;
    const w = h * outputAspectRatio;
    const x = source.w * 0.5 - w * 0.5;
    return { x, y, w, h };
  } else if (inputAspectRatio < outputAspectRatio) {
    const x = 0;
    const w = source.w;
    const h = w * outputAspectRatio;
    const y = source.h * 0.5 - h * 0.5;
    return { x, y, w, h };
  }

  // fixme, have a helper that returns 'equal', 'greater', 'lesser' and swith?
  console.log(source, destination);
  console.log(inputAspectRatio, outputAspectRatio);
  throw new Error('halp');
}
