import { getSourceCrop } from '../util';

describe('getSourceCrop', () => {
  test('same ratio, same size', () => {
    const source = { w: 200, h: 200 };
    const destination = { w: 200, h: 200 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 0, y: 0, w: 200, h: 200 });
  });

  test('same ratio, source is smaller', () => {
    const source = { w: 160, h: 120 };
    const destination = { w: 320, h: 240 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 0, y: 0, w: 160, h: 120 });
  });

  test('same ratio, source is larger', () => {
    const source = { w: 200, h: 800 };
    const destination = { w: 100, h: 400 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 0, y: 0, w: 200, h: 800 });
  });

  test('same ratio but rounding errors', () => {
    const source = { w: 640, h: 360 };
    const destination = { w: 1155.5555555555557, h: 650 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 0, y: 0, w: 630, h: 360 });
  });

  test('source ratio is greater (wider), source is smaller, 1', () => {
    const source = { w: 400, h: 200 };
    const destination = { w: 600, h: 600 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 100, y: 0, w: 200, h: 200 });
  });

  test('source ratio is greater (wider), source is smaller, 2', () => {
    const source = { w: 320, h: 100 };
    const destination = { w: 640, h: 480 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({
      x: 93.33333333333334,
      y: 0,
      w: 133.33333333333331,
      h: 100,
    });
  });

  test('source ratio is greater (wider), source is larger', () => {
    const source = { w: 1400, h: 1200 };
    const destination = { w: 600, h: 600 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 100, y: 0, w: 1200, h: 1200 });
  });

  test('source ratio is greater (wider), source is larger 2', () => {
    const source = { w: 900, h: 300 };
    const destination = { w: 240, h: 320 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 337.5, y: 0, w: 225, h: 300 });
  });

  test('source ratio is smaller (taller), source is smaller, 1', () => {
    const source = { w: 200, h: 400 };
    const destination = { w: 600, h: 600 };
    const destinationRatio = (destination.w / destination.h).toFixed(3);

    const cropped = getSourceCrop(source, destination);
    const croppedRatio = (cropped.w / cropped.h).toFixed(3);

    expect(croppedRatio).toEqual(destinationRatio);
    expect(cropped).toEqual({ x: 0, y: 100, w: 200, h: 200 });
  });
});
