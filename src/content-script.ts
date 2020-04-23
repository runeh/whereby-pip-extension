import { getLayout, LayoutBox } from './layout';

interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  videoContainers: HTMLCollectionOf<HTMLElement>;
}

interface Displayable {
  videoEle: HTMLVideoElement;
  layout: LayoutBox;
  name: string;
  muted: boolean;
  big: boolean;
  me: boolean;
}

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
function getDisplayables(outputSize: {
  width: number;
  height: number;
}): readonly Displayable[] {
  const { height, width } = outputSize;

  const eles = Array.from(
    document.querySelectorAll('.jstest-client-video'),
  ) as HTMLElement[];

  const layouts = getLayout(
    { containerHeight: height, containerWidth: width, fixedRatio: true },
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

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');
  // 1280x720
  // 1024×576
  // 640x 360
  canvas.width = 1280;
  canvas.height = 720;

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

function tick(state: PipState) {
  const { context, canvas } = state;

  // should trigger outside of the tick.
  // maybe rename "tick" to "render"
  const displayables = getDisplayables({
    width: canvas.width,
    height: canvas.height,
  });

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

async function mainLoop(state: PipState) {
  while (showPip) {
    tick(state);
    await sleep(33);
  }
}

async function initExtension() {
  // fixme: remove / move this
  await waitForConnectedRoom();
  const state = initMediaPipState();
  const { pipVideo } = state;

  if (isDev) {
    pipVideo.style.position = 'fixed';
    pipVideo.style.top = '0';
    pipVideo.style.right = '0';
    pipVideo.style.width = '40px';
  }
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

  currentState = currentState || (await initExtension());

  if (showPip) {
    tick(currentState);
    await videoReady(currentState);
    await currentState.pipVideo.requestPictureInPicture();
    await mainLoop(currentState);
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
