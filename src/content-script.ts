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

  const guests = Array.from(eles).map((item) => {
    const video = item.querySelector('video');
    const name = item.querySelector('[class|=nameBanner]').textContent;
    return {
      height: video.videoHeight,
      width: video.videoWidth,
      big: isBig(item),
      name,
      video,
    };
  });

  const layouts = getLayout(
    { containerHeight: height, containerWidth: width, fixedRatio: true },
    guests,
  );

  return pairs(guests, layouts)
    .sort((a, b) => a[0].name.localeCompare(b[0].name))
    .map<Displayable>(([guest, layout]) => {
      return { layout, videoEle: guest.video, name: guest.name, muted: false };
    });
}

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');
  // 1024×576
  // 1280x720
  // 640x 360
  canvas.width = 1024;
  canvas.height = 576;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');
  return { canvas, context, pipVideo, videoContainers: sources };
}

function isBig(element: HTMLElement): boolean {
  return element.dataset.clientid === 'local-screenshare';
}

function isMirrored(element: HTMLElement): boolean {
  return element.className.includes('mirror-');
}

function getGuestsId(eles: readonly HTMLElement[]): string {
  return eles
    .map((e) => e.dataset.clientid)
    .sort()
    .join();
}

function tick(state: PipState) {
  const { context, pipVideo, canvas } = state;

  // should trigger outside of the tick.
  // maybe rename "tick" to "render"
  const displayables = getDisplayables({
    width: canvas.width,
    height: canvas.height,
  });

  // // const eles = Array.from(sources)
  // //   .filter((e) => e !== pipVideo)
  // //   .filter((e) => e.videoWidth);

  // // fixme: move some of this away
  // // maybe have this be "render" and have other stuff in the
  // // mainloop function

  // const dims = getLayout(
  //   {
  //     containerWidth: canvas.width,
  //     containerHeight: canvas.height,
  //     fixedRatio: true,
  //   },
  //   eles.map((e) => {
  //     return {
  //       height: e.videoHeight,
  //       width: e.videoWidth,
  //       big: false,
  //     };
  //   }),
  // );

  // if (dims.some(Number.isNaN)) {
  //   return;
  // }

  // fixme: do we need to check for nan?

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#000000';

  displayables.forEach((e) => {
    const { left, top, height, width } = e.layout;
    context.drawImage(e.videoEle, left, top, width, height);
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
