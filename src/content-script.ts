import { getLayout } from './layout';

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

  canvas.width = 320;
  canvas.height = 240;

  pipVideo.style.backgroundColor = 'gray';
  pipVideo.muted = true;
  pipVideo.autoplay = true;
  //pipVideo.controls = true;
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

  // fixme: here we add the scaling logic thing
  eles.forEach((video, _index) => {
    //   console.log(
    //     video.videoWidth,
    //     video.videoHeight,
    //     '/',
    //     _index,
    //     dims[_index].top,
    //     dims[_index].left,
    //     dims[_index].width,
    //     dims[_index].height,
    //   );

    const { left, top, height, width } = dims[_index];
    context.drawImage(video, left, top, width, height);
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
    await sleep(33);
  }
}

async function main() {
  await waitForConnectedRoom();
  const state = initMediaPipState();
  const { pipVideo, canvas } = state;

  // pipVideo.width = 300;
  // pipVideo.height = 300;

  if (isDev) {
    // canvas.style.width = '300';
    // canvas.style.height = '300px';
    // canvas.style.border = 'solid thin red';
    // canvas.style.position = 'fixed';
    // canvas.style.top = '0';
    // canvas.style.left = '0';
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
