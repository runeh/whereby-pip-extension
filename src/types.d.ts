interface HTMLCanvasElement {
  captureStream(): MediaStream;
}

interface HTMLVideoElement {
  requestPictureInPicture(): Promise<void>;
}

interface Document {
  exitPictureInPicture(): Promise<void>;
}
