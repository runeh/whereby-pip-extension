import { LayoutBox } from './layout';

export interface Resolution {
  width: number;
  height: number;
}

export interface Options {
  flipSelf: boolean;
  showMuteIndicator: boolean;
  showNames: boolean;
  showOwnVideo: boolean;
  videoResolution: Resolution;
  frameRate: number;
  keepAspectRatio: boolean;
}

export interface PipState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pipVideo: HTMLVideoElement;
  videoContainers: HTMLCollectionOf<HTMLElement>;
}

export interface Displayable {
  videoEle: HTMLVideoElement;
  layout: LayoutBox;
  source: LayoutBox;
  name: string;
  muted: boolean;
  big: boolean;
  me: boolean;
}
