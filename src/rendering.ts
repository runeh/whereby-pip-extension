import { Options, Displayable } from './types';

export function renderGuestFrame(
  context: CanvasRenderingContext2D,
  opts: Options,
  displayables: readonly Displayable[],
  muteIcon: HTMLImageElement,
) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  displayables.forEach((e) => {
    const { source, layout, muted, videoEle, name } = e;

    context.drawImage(
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

    const iconSize = 64;
    const padding = 10;

    if (opts.showMuteIndicator && muted) {
      const x = padding;
      const y = layout.h - iconSize - padding;
      context.save();
      roundRectMask({
        ctx: context,
        x,
        y,
        w: iconSize,
        h: iconSize,
        radius: 12,
      });
      context.fillStyle = '#f26b4d';
      context.fillRect(x, y, iconSize, iconSize);
      context.drawImage(muteIcon, x + 4, y + 4, iconSize - 8, iconSize - 8);
      context.restore();
    }

    /**
     * Use translate on the canvas, so we don't need to care about
     * the position on the canvas, just w/h ?
     * Maybe mask it out, so frame can't overshoot?
     */

    if (opts.showNames) {
      const fontSize = Math.floor(layout.h / 16);
      context.font = `${fontSize}px sans-serif`;
      context.textBaseline = 'bottom';

      const textX =
        padding + (opts.showMuteIndicator ? iconSize : 0) + padding + padding;
      const textY = layout.h - padding;
      const textWidth = context.measureText(name).width + padding * 3;

      const boxX = padding + (opts.showMuteIndicator ? iconSize : 0) + padding;
      const boxY = layout.h - padding - iconSize;
      // const boxY = layout.h - padding - fontSize;
      const boxH = iconSize;
      const boxW = textWidth;

      context.save();
      roundRectMask({
        ctx: context,
        x: boxX,
        y: boxY,
        w: boxW,
        h: boxH,
        radius: 12,
      });

      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(boxX, boxY, boxW, boxH);

      context.fillStyle = '#FFFFFF';
      context.fillText(name, textX, textY);
      context.restore();
    }

    context.lineWidth = 1;
    context.strokeStyle = '#000000';
    context.strokeRect(layout.x, layout.y, layout.w, layout.h);
  });
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
