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
}

export interface LayoutBox {
  left: number;
  top: number;
  height: number;
  width: number;
}

export function getLayout(
  opts: LayoutOpts,
  boxes: readonly InputBox[],
): readonly LayoutBox[] {
  const layoutManger = initLayoutContainer(null, opts);
  return layoutManger.getLayout(boxes);
}
