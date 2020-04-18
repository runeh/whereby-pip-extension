let hasBooted = false;
let canvasEle;
let outVideo;
let ctx;

let stream;

const videoElements = document.getElementsByTagName('video');

function setup() {
  if (hasBooted) {
    return;
  }

  canvasEle = document.createElement('canvas');
  ctx = canvasEle.getContext('2d');

  canvasEle.style.width = '320px';
  canvasEle.style.height = '240px';

  canvasEle.style.position = 'fixed';
  canvasEle.style.backgroundColor = 'gray';
  canvasEle.style.top = '0';
  canvasEle.style.left = '0';
  canvasEle.style.border = 'solid thick bold';

  // document.body.appendChild(canvasEle);

  outVideo = document.createElement('video');

  // outVideo.style.width = '320px';
  // outVideo.style.height = '240px';
  outVideo.style.position = 'fixed';
  outVideo.style.top = '0';
  outVideo.style.right = '0';
  outVideo.style.border = 'solid thick gold';
  outVideo.muted = true;
  outVideo.autoplay = true;
  outVideo.width = 240;
  outVideo.height = 160;

  document.body.appendChild(outVideo);

  stream = canvasEle.captureStream();
  outVideo.srcObject = stream;

  hasBooted = true;
}

let frameGuard = 0;

function ticker() {
  if (!hasBooted) {
    setTimeout(ticker, 1000);
    return;
  }

  const eles = Array.from(videoElements).filter((e) => e !== outVideo);

  eles.forEach((video, index) => {
    ctx.drawImage(video, 0, index * 20, 120, 80);
  });

  if (frameGuard++ < 3000) {
    setTimeout(ticker, 33);
  } else {
    //           outVideo.remove()
    // canvasEle.remove();
  }
}

function main() {
  const ele = document.querySelector('[class|=ConnectedRoom]');
  console.log('in the main', !!ele);
  if (ele) {
    setup();
    ticker();
  } else {
    setTimeout(main, 1000);
  }
}

main();

// WebRtcVideo-1rhW WebRtcVideo jstest-client-video jstest-local-client-video mirror-Whm2 WebRtcVideo--zoomed-3LH5 undefined WebRtcVideo--draggable-1ZoZ
