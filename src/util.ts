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

export function getCropMode(
  source: Size,
  dest: Size,
): 'equal' | 'source_is_greater' | 'destination_is_greater' {
  const sourceAspectRatio = Math.round((source.w / source.h) * 1000);
  const destAspectRatio = Math.round((dest.w / dest.h) * 1000);

  if (sourceAspectRatio === destAspectRatio) {
    return 'equal';
  } else if (sourceAspectRatio > destAspectRatio) {
    return 'source_is_greater';
  } else {
    return 'destination_is_greater';
  }
}

export function getSourceCrop(source: Size, dest: Size): Crop {
  const destAspectRatio = dest.w / dest.h;

  switch (getCropMode(source, dest)) {
    case 'equal':
      return { x: 0, y: 0, w: source.w, h: source.h };
    case 'source_is_greater': {
      const y = 0;
      const h = source.h;
      const w = h * destAspectRatio;
      const x = source.w * 0.5 - w * 0.5;
      return { x, y, w, h };
    }
    case 'destination_is_greater': {
      const x = 0;
      const w = source.w;
      const h = w * destAspectRatio;
      const y = source.h * 0.5 - h * 0.5;
      return { x, y, w, h };
    }
  }
}

export function roundRectMask(opts: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}) {
  const { ctx, h, w, x, y } = opts;
  let radius = opts.radius;
  if (w < 2 * radius) {
    radius = w / 2;
  }
  if (h < 2 * radius) {
    radius = h / 2;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.clip();
}
