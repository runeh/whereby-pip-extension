import initLayoutContainer from 'opentok-layout-js';

interface InputBox {
  width: number;
  height: number;
  big: boolean;
}

interface LayoutOpts {
  fixedRatio: boolean;
  containerWidth: number;
  containerHeight: number;
  bigFixedRatio: boolean;
}

export interface LayoutBox {
  x: number;
  y: number;
  h: number;
  w: number;
}

export function getLayout(
  opts: LayoutOpts,
  boxes: readonly InputBox[],
): readonly LayoutBox[] {
  const layoutManger = initLayoutContainer(null, opts);
  return layoutManger.getLayout(boxes).map((e) => ({
    x: e.left,
    y: e.top,
    w: e.width,
    h: e.height,
  }));
}
