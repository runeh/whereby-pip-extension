import { getLayout } from './layout';

interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  sources: HTMLCollectionOf<HTMLVideoElement>;
}

const isDev = process.env.NODE_ENV === 'development';

let showPip = false;
let initialized = false;

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');
  // 1024×576
  // 1280x720
  // 640x 360
  canvas.width = 1024;
  canvas.height = 800;

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');

  return { canvas, context, pipVideo, sources };
}

function tick(state: PipState) {
  const { sources, context, pipVideo, canvas } = state;
  const eles = Array.from(sources)
    .filter((e) => e !== pipVideo)
    .filter((e) => e.videoWidth);

  // fixme: move some of this away
  // maybe have this be "render" and have other stuff in the
  // mainloop function

  const dims = getLayout(
    {
      containerWidth: canvas.width,
      containerHeight: canvas.height,
      fixedRatio: true,
    },
    eles.map((e) => {
      return {
        height: e.videoHeight,
        width: e.videoWidth,
        big: false,
      };
    }),
  );

  // console.log(JSON.stringify(dims, null, 2));
  if (dims.some(Number.isNaN)) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#000000';
  eles.forEach((video, _index) => {
    const { left, top, height, width } = dims[_index];
    context.drawImage(video, left, top, width, height);
    context.strokeRect(left, top, width, height);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForConnectedRoom() {
  while (document.querySelector('[class|=ConnectedRoom]') == null) {
    await sleep(2000);
  }
}

async function mainLoop(state: PipState) {
  while (showPip) {
    console.log('vidstate3', currentState.pipVideo.readyState);
    tick(state);
    await sleep(33);
  }
}

async function initExtension() {
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

  if (showPip) {
    currentState = await initExtension();
    console.log('vidstate1', currentState.pipVideo.readyState);

    await tick(currentState);
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
  console.log('got a message in content script1234', message);
  main();
});

chrome.runtime.sendMessage({ greeting: 'hello' });
