import { getLayout, LayoutBox } from './layout';
import { Displayable, PipState, Options } from './types';

// @ts-ignore
const isDev = process.env.NODE_ENV === 'development';

let showPip = false;

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

  const eles = Array.from(
    document.querySelectorAll('.jstest-client-video'),
  ) as HTMLElement[];

  const layouts = getLayout(
    {
      containerHeight: height,
      containerWidth: width,
      fixedRatio: opts.keepAspectRatio,
    },
    eles.map((e) => {
      const { videoHeight, videoWidth } = e.querySelector('video');
      return { height: videoHeight, width: videoWidth, big: isBig(e) };
    }),
  );

  return pairs(eles, layouts).map<Displayable>(([ele, layout]) => ({
    layout,
    me: false,
    big: isBig(ele),
    muted: isMuted(ele),
    name: ele.querySelector('[class|=nameBanner]').textContent,
    videoEle: ele.querySelector('video'),
  }));
}

function initMediaPipState(opts: Options): PipState {
  const { height, width } = opts.videoResolution;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');
  canvas.width = width;
  canvas.height = height;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');
  return { canvas, context, pipVideo, videoContainers: sources };
}

function isBig(element: HTMLElement): boolean {
  return element.dataset.clientid === 'local-screenshare';
}

function isMuted(element: HTMLElement): boolean {
  return element.querySelector('.jstest-mute-icon') != null;
}

function tick(state: PipState, opts: Options) {
  const { context, canvas } = state;

  // should trigger outside of the tick.
  // maybe rename "tick" to "render"
  const displayables = getDisplayables(opts);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#000000';

  displayables.forEach((e) => {
    const { left, top, height, width } = e.layout;
    const { muted, videoEle } = e;
    context.drawImage(videoEle, left, top, width, height);
    context.lineWidth = muted ? 4 : 1;
    context.strokeStyle = muted ? '#FF0000' : '#000000';
    context.strokeRect(left, top, width, height);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForConnectedRoom() {
  while (document.querySelector('[class|=ConnectedRoom]') == null) {
    await sleep(200);
  }
}

async function mainLoop(state: PipState, opts: Options) {
  const frameDelay = Math.ceil(1000 / opts.frameRate);
  while (showPip) {
    tick(state, opts);
    await sleep(frameDelay);
  }
}

async function initExtension(opts: Options) {
  // fixme: remove / move this
  await waitForConnectedRoom();
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

let currentState: PipState | undefined;

async function main() {
  showPip = !showPip;

  const opts: Options = {
    flipSelf: false,
    frameRate: 3,
    keepAspectRatio: true,
    showNames: true,
    showMuteIndicator: true,
    showOwnVideo: true,
    videoResolution: {
      // 1280x720
      // 1024×576
      // 640x 360
      width: 1280,
      height: 720,
    },
  };

  currentState = currentState || (await initExtension(opts));

  if (showPip) {
    tick(currentState, opts);
    await videoReady(currentState);
    await currentState.pipVideo.requestPictureInPicture();
    await mainLoop(currentState, opts);
    await document.exitPictureInPicture();
    currentState.pipVideo.remove();
    currentState.pipVideo.srcObject = undefined;
    currentState = undefined;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  main();
});

chrome.runtime.sendMessage({ greeting: 'hello' });
