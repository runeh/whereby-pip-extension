import { computeLayout } from './layout';

interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  sources: HTMLCollectionOf<HTMLVideoElement>;
}

const isDev = process.env.NODE_ENV === 'development';

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');

  canvas.width = 640;
  canvas.height = 480;

  pipVideo.style.backgroundColor = 'gray';
  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.controls = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');

  return { canvas, context, pipVideo, sources };
}

function tick(state: PipState) {
  const { sources, context, pipVideo } = state;
  const eles = Array.from(sources).filter((e) => e !== pipVideo);

  // fixme: move this away
  const dims = computeLayout(
    { fixedRatio: false, containerWidth: 640, containerHeight: 480 },
    eles.map((e) => ({ height: e.videoHeight, width: e.videoHeight })),
  );

  if (dims.some(Number.isNaN)) {
    return;
  }

  // console.log(dims);

  // fixme: here we add the scaling logic thing
  eles.forEach((video, _index) => {
    console.log(
      video.videoWidth,
      video.videoHeight,
      '/',
      _index,
      dims[_index].width,
      dims[_index].height,
    );

    const { left, top, height, width } = dims[_index];
    // console.log(dims[_index]);
    // console.log('drawing');
    context.drawImage(video, left, top, width, height);
    // context.drawImage(video, 0, 0, 640, 480);
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
  let safety = 3;

  while (safety-- > 0) {
    tick(state);
    await sleep(10000);
  }
}

async function main() {
  await waitForConnectedRoom();
  const state = initMediaPipState();
  const { pipVideo, canvas } = state;

  // pipVideo.width = 640;
  // pipVideo.height = 480;

  if (isDev) {
    // canvas.style.width = '160px';
    // canvas.style.height = '120px';
    // canvas.style.border = 'solid thin red';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    // document.body.appendChild(canvas);
  }

  // pipVideo.style.width = '160px';
  // pipVideo.style.height = '120px';
  // pipVideo.style.border = 'solid thin red';
  pipVideo.style.position = 'fixed';
  pipVideo.style.top = '0';
  pipVideo.style.right = '0';

  document.body.appendChild(pipVideo);
  mainLoop(state);
}

main();
