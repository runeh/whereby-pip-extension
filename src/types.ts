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

export interface Displayable {
  videoEle: HTMLVideoElement;
  layout: LayoutBox;
  source: LayoutBox;
  name: string;
  muted: boolean;
  big: boolean;
  me: boolean;
}

export interface PiPMedia {
  pipCtx: CanvasRenderingContext2D;
  pipVideoEle: HTMLVideoElement;
}
