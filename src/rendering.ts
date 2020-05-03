import { Options, Displayable } from './types';

export function renderGuestFrame(
  ctx: CanvasRenderingContext2D,
  opts: Options,
  displayables: readonly Displayable[],
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  displayables.forEach((e) => {
    renderFrame(opts, ctx, e);
    renderMuteIndicator(opts, ctx, e);
    renderGuestName(opts, ctx, e);
  });
  ctx.restore();
}

function renderMuteIndicator(
  opts: Options,
  ctx: CanvasRenderingContext2D,
  displayable: Displayable,
) {
  const { showMuteIndicator } = opts;
  const { muted, layout } = displayable;

  if (!showMuteIndicator || !muted) {
    return;
  }

  const { boxHeight, spacing, radius } = getDims(layout.h);

  ctx.save();
  ctx.translate(layout.x, layout.y);

  const x = spacing;
  const y = layout.h - boxHeight - spacing;
  roundRectMask({ ctx: ctx, x, y, w: boxHeight, h: boxHeight, radius });
  ctx.fillStyle = '#f26b4d';
  ctx.fillRect(x, y, boxHeight, boxHeight);

  ctx.restore();
}

function renderGuestName(
  opts: Options,
  ctx: CanvasRenderingContext2D,
  displayable: Displayable,
) {
  if (!opts.showNames) {
    return;
  }

  const { layout, muted, name } = displayable;
  const { showMuteIndicator } = opts;
  const { boxHeight, spacing, radius, fontSize } = getDims(layout.h);

  ctx.save();
  ctx.translate(layout.x, layout.y);

  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'bottom';

  const hasMuteIndicator = showMuteIndicator && muted;

  const textWidth = ctx.measureText(name).width;

  const boxX = spacing + (hasMuteIndicator ? boxHeight + spacing : 0);
  const boxW = textWidth + spacing * 2;
  const boxH = boxHeight;
  const boxY = layout.h - boxHeight - spacing;
  const textX = boxX + spacing;
  const textY = layout.h - spacing;

  roundRectMask({ ctx: ctx, x: boxX, y: boxY, w: boxW, h: boxH, radius });

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, textX, textY);
  ctx.restore();
}

function renderFrame(
  opts: Options,
  ctx: CanvasRenderingContext2D,
  displayable: Displayable,
) {
  const { flipSelf } = opts;
  const { source, layout, videoEle, me } = displayable;
  ctx.save();

  // fixme: rename flip to mirror?
  if (flipSelf && me) {
    ctx.translate(ctx.canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    videoEle,
    source.x,
    source.y,
    source.w,
    source.h,
    layout.x,
    layout.y,
    layout.w,
    layout.h,
  );

  // draw a black border around it.
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(layout.x, layout.y, layout.w, layout.h);
  ctx.restore();
}

function roundRectMask(opts: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}) {
  const { ctx, h, w, x, y } = opts;
  let radius = opts.radius;
  if (w < 2 * radius) {
    radius = w / 2;
  }
  if (h < 2 * radius) {
    radius = h / 2;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.clip();
}

interface RenderingDimensions {
  fontSize: number;
  radius: number;
  spacing: number;
  boxHeight: number;
}

function getDims(h: number): RenderingDimensions {
  // fixme: tune dims. Maybe add font positioning Or test the other baseline
  // stuff?
  // console.log('get dims for h', h);
  if (h <= 240) {
    return {
      fontSize: 18,
      spacing: 4,
      radius: 4,
      boxHeight: 24,
    };
  } else {
    return {
      fontSize: 42,
      spacing: 6,
      radius: 12,
      boxHeight: 54,
    };
  }
}
