import { Options, Displayable } from './types';

export function renderGuestFrame(
  ctx: CanvasRenderingContext2D,
  opts: Options,
  displayables: readonly Displayable[],
  muteIcon: HTMLImageElement,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  displayables.forEach((e) => {
    const { source, layout, muted, videoEle, name } = e;

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

    const iconSize = 64;
    const padding = 10;

    if (opts.showMuteIndicator && muted) {
      const x = padding;
      const y = layout.h - iconSize - padding;
      ctx.save();
      roundRectMask({
        ctx: ctx,
        x,
        y,
        w: iconSize,
        h: iconSize,
        radius: 12,
      });
      ctx.fillStyle = '#f26b4d';
      ctx.fillRect(x, y, iconSize, iconSize);
      ctx.drawImage(muteIcon, x + 4, y + 4, iconSize - 8, iconSize - 8);
      ctx.restore();
    }

    /**
     * Use translate on the canvas, so we don't need to care about
     * the position on the canvas, just w/h ?
     * Maybe mask it out, so frame can't overshoot?
     */

    if (opts.showNames) {
      const fontSize = Math.floor(layout.h / 16);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = 'bottom';

      const textX =
        padding + (opts.showMuteIndicator ? iconSize : 0) + padding + padding;
      const textY = layout.h - padding;
      const textWidth = ctx.measureText(name).width + padding * 3;

      const boxX = padding + (opts.showMuteIndicator ? iconSize : 0) + padding;
      const boxY = layout.h - padding - iconSize;
      // const boxY = layout.h - padding - fontSize;
      const boxH = iconSize;
      const boxW = textWidth;

      ctx.save();
      roundRectMask({
        ctx: ctx,
        x: boxX,
        y: boxY,
        w: boxW,
        h: boxH,
        radius: 12,
      });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(name, textX, textY);
      ctx.restore();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(layout.x, layout.y, layout.w, layout.h);
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
