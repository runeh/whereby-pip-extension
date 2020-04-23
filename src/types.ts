import { LayoutBox } from './layout';

export interface Options {
  flipSelf: boolean;
  showMuteIndicator: boolean;
  showNames: boolean;
  showOwnVideo: boolean;
  videoResolution: { width: number; height: number };
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
  name: string;
  muted: boolean;
  big: boolean;
  me: boolean;
}
