import { getLayout } from './layout';

interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  sources: HTMLCollectionOf<HTMLVideoElement>;
}

const isDev = process.env.NODE_ENV === 'development';

chrome.runtime.onMessage.addListener((message) => {
  console.log('got a message in content script', message);
});

chrome.runtime.sendMessage({ greeting: 'hello' });

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');
  // 1024×576
  // 1280x720
  canvas.width = 640;
  canvas.height = 360;

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
  let safety = 3000;

  while (safety-- > 0) {
    tick(state);
    await sleep(66);
  }
}

async function main() {
  await waitForConnectedRoom();
  const state = initMediaPipState();
  const { pipVideo } = state;

  if (isDev) {
    pipVideo.style.position = 'fixed';
    pipVideo.style.top = '0';
    pipVideo.style.right = '0';
    pipVideo.style.width = '300px';
  }

  document.body.appendChild(pipVideo);
  mainLoop(state);
}

main();
