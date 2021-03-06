import { getLayout, LayoutBox } from './layout';
import { Displayable, Options, PiPMedia } from './types';
import { loadOptions, getSourceCrop } from './util';
import { renderGuestFrame } from './rendering';

// @ts-ignore
const isDev = process.env.NODE_ENV === 'development';

const TIME_BETWEEN_DISPLAYABLE_UPDATES_MS = 500;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}

function getVideo(ele: HTMLElement): HTMLVideoElement {
  const video = ele.querySelector('video');
  assertIsDefined(video);
  return video;
}

function getName(ele: HTMLElement): string | undefined {
  return ele.querySelector('[class|=nameBanner]')?.textContent || undefined;
}

function getSourceLocation(
  videoEle: HTMLVideoElement,
  layout: LayoutBox,
): LayoutBox {
  const ret = getSourceCrop(
    { w: videoEle.videoWidth, h: videoEle.videoHeight },
    { w: layout.w, h: layout.h },
  );

  return { h: ret.h, w: ret.w, x: ret.x, y: ret.y };
}

function pairs<T1, T2>(
  firstList: readonly T1[],
  secondList: readonly T2[],
): [T1, T2][] {
  if (firstList.length !== secondList.length) {
    throw new Error('Arrays must be same size');
  }

  return firstList.map((e, n) => [e, secondList[n]]);
}

/**
 * fixme: this can be cleaned up probs.
 */
function getDisplayables(opts: Options): readonly Displayable[] {
  const { height, width } = opts.videoResolution;

  const eles = Array.from<HTMLElement>(
    document.querySelectorAll('.jstest-client-video'),
  )
    .filter((e) => {
      const isOwnVideo = e.classList.contains('jstest-local-client-video');
      return isOwnVideo ? opts.showOwnVideo : true;
    })
    .filter((e) => {
      const video = getVideo(e);
      return video.videoWidth && video.videoHeight;
    });

  const layouts = getLayout(
    {
      containerHeight: height,
      containerWidth: width,
      fixedRatio: opts.keepAspectRatio,
      // fixme:
      bigFixedRatio: true,
    },
    eles.map((e) => {
      const { videoHeight, videoWidth } = getVideo(e);
      return { height: videoHeight, width: videoWidth, big: isBig(e) };
    }),
  );

  return pairs(eles, layouts).map<Displayable>((pair) => {
    const [ele, layout] = pair;
    const videoEle = getVideo(ele);
    return {
      layout,
      me: ele.classList.contains('jstest-local-client-video'),
      big: isBig(ele),
      muted: isMuted(ele),
      name: getName(ele) || 'no name',
      videoEle,
      source: getSourceLocation(videoEle, layout),
    };
  });
}

async function initMedia(opts: Options): Promise<PiPMedia> {
  const { width, height } = opts.videoResolution;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  assertIsDefined(ctx);

  const pipVideo = document.createElement('video');
  canvas.width = width;
  canvas.height = height;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();
  pipVideo.style.visibility = 'hidden';
  pipVideo.style.width = '0';
  pipVideo.style.height = '0';

  ctx.fillStyle = '#000000';
  // Rendering something to the canvas makes sure the video gets
  // to the correct ready state
  ctx.fillRect(0, 0, width, height);

  return { pipCtx: ctx, pipVideoEle: pipVideo };
}

function isBig(ele: HTMLElement): boolean {
  if (ele.dataset.clientid === 'local-screenshare') {
    return true;
  } else {
    const name = getName(ele);
    return name !== undefined && name.includes('Screenshare');
  }
}

function isMuted(ele: HTMLElement): boolean {
  return ele.querySelector('.jstest-mute-icon') != null;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function mainLoop(ctx: CanvasRenderingContext2D, opts: Options) {
  const frameDelay = Math.ceil(1000 / opts.frameRate);

  let displayableUpdateTs = 0;
  let displayables: readonly Displayable[] = [];
  while (document.pictureInPictureElement) {
    const now = Date.now();

    if (now - displayableUpdateTs > TIME_BETWEEN_DISPLAYABLE_UPDATES_MS) {
      displayables = getDisplayables(opts);
      displayableUpdateTs = now;
    }

    renderGuestFrame(ctx, opts, displayables);
    await sleep(frameDelay);
  }
}

async function videoReady(video: HTMLVideoElement) {
  while (true) {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      return;
    }
    await sleep(33);
  }
}

async function main() {
  const opts = await loadOptions();

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else {
    const { pipCtx, pipVideoEle: pipVideo } = await initMedia(opts);
    await videoReady(pipVideo);
    document.body.appendChild(pipVideo);
    await pipVideo.requestPictureInPicture();
    await mainLoop(pipCtx, opts);
    pipVideo.srcObject = null;
    pipVideo.remove();
  }
}

chrome.runtime.onMessage.addListener((_message) => {
  main();
});

chrome.storage.onChanged.addListener(async () => {
  // todo: figure out something
});
