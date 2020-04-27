import { getLayout, LayoutBox } from './layout';
import { Displayable, PipState, Options } from './types';
import { loadOptions, getSourceCrop } from './util';

// @ts-ignore
const isDev = process.env.NODE_ENV === 'development';

let showPip = false;

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
 * @param state
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
    if (!videoEle) {
      throw new Error('blargh'); // fixme: use assertion ts
    }
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

interface MediaObjects {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
}

function initMediaObjects(): MediaObjects {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  assertIsDefined(context);

  const pipVideo = document.createElement('video');
  canvas.width = 320;
  canvas.height = 240;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  return { canvas, context, pipVideo };
}

function updateMediaObjects(
  current: MediaObjects,
  opts: Options,
): MediaObjects {
  current.canvas.width = opts.videoResolution.width;
  current.canvas.height = opts.videoResolution.height;
  return current;
}

function initMediaPipState(opts: Options): PipState {
  const { height, width } = opts.videoResolution;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  assertIsDefined(context);
  const pipVideo = document.createElement('video');
  canvas.width = width;
  canvas.height = height;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');
  return { canvas, context, pipVideo, videoContainers: sources };
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

function tick(state: PipState, opts: Options) {
  const { context, canvas } = state;

  // should trigger outside of the tick.
  // maybe rename "tick" to "render"
  const displayables = getDisplayables(opts);

  context.clearRect(0, 0, canvas.width, canvas.height);

  displayables.forEach((e) => {
    const { source, layout, muted, videoEle } = e;
    context.drawImage(
      videoEle,
      source.x,
      source.y,
      source.w,
      source.h,
      layout.x,
      layout.y,
      layout.w,
      layout.h,
    );
    context.lineWidth = opts.showMuteIndicator && muted ? 4 : 1;
    context.strokeStyle =
      opts.showMuteIndicator && muted ? '#FF0000' : '#000000';
    context.strokeRect(layout.x, layout.y, layout.w, layout.h);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function mainLoop(state: PipState, opts: Options) {
  const frameDelay = Math.ceil(1000 / opts.frameRate);
  while (showPip) {
    tick(state, opts);
    await sleep(frameDelay);
  }
}

async function initExtension(opts: Options) {
  const state = initMediaPipState(opts);
  const { pipVideo } = state;
  pipVideo.style.visibility = 'hidden';
  document.body.appendChild(pipVideo);
  return state;
}

async function videoReady(state: PipState) {
  while (true) {
    if (state.pipVideo.readyState === state.pipVideo.HAVE_ENOUGH_DATA) {
      return;
    }
    await sleep(33);
  }
}

let mediaObjects: MediaObjects | undefined;
let currentState: PipState | undefined;

async function main() {
  const opts = await loadOptions();
  showPip = !showPip;
  currentState = currentState || (await initExtension(opts));

  if (showPip) {
    tick(currentState, opts);
    await videoReady(currentState);
    await currentState.pipVideo.requestPictureInPicture();
    await mainLoop(currentState, opts);
    await document.exitPictureInPicture();
    currentState.pipVideo.remove();
    currentState.pipVideo.srcObject = null;
    currentState = undefined;
  }
}

chrome.runtime.onMessage.addListener((_message) => {
  main();
});
