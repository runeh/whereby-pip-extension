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

//     fixedRatio: true,
//     containerWidth: 200,
//     containerHeight: 200,

export function getLayout(opts: LayoutOpts, boxes: readonly InputBox[]) {
  const fakeContainer = document.createElement('div');
  fakeContainer.style.width = '100px';
  fakeContainer.style.height = '100px';
  const layoutManger = initLayoutContainer(fakeContainer, opts);
  console.log('wat boxes', JSON.stringify(boxes, null, 2));
  return layoutManger.getLayout(boxes);
}
