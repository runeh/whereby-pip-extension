interface HTMLCanvasElement {
  captureStream(): MediaStream;
}

interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  sources: HTMLCollectionOf<HTMLVideoElement>;
}

const isDev = process.env.NODE_ENV === 'development';

console.log('extension is dev?', isDev);

function initMediaPipState(): PipState {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pipVideo = document.createElement('video');

  pipVideo.style.backgroundColor = 'gray';

  pipVideo.muted = true;
  pipVideo.autoplay = true;
  pipVideo.srcObject = canvas.captureStream();

  const sources = document.getElementsByTagName('video');

  return { canvas, context, pipVideo, sources };
}

function tick(state: PipState) {
  const { sources, context, pipVideo } = state;
  const eles = Array.from(sources).filter((e) => e !== pipVideo);

  // fixme: here we add the scaling logic thing
  eles.forEach((video, _index) => {
    context.drawImage(video, 0, 0, 160, 120);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForConnectedRoom() {
  while (document.querySelector('[class|=ConnectedRoom]') == null) {
    if (isDev) {
      console.log('sleeping');
    }
    await sleep(2000);
  }
}

async function mainLoop(state: PipState) {
  let safety = 5000;
  while (safety-- > 0) {
    tick(state);
    await sleep(33);
  }
}

async function main() {
  await waitForConnectedRoom();
  const state = initMediaPipState();
  const { pipVideo } = state;

  // pipVideo.width = 320;
  // pipVideo.height = 240;

  pipVideo.width = 491;
  pipVideo.height = 276;

  pipVideo.style.border = 'solid thin red';
  pipVideo.style.position = 'fixed';
  pipVideo.style.top = '0';
  pipVideo.style.right = '0';

  document.body.appendChild(pipVideo);
  mainLoop(state);
}

main();
