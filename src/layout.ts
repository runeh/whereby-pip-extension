// adapted from
// https://github.com/aullman/opentok-layout-js/blob/master/src/getLayout.js

interface Item {
  width: number;
  height: number;
  big?: boolean;
}

interface Dimension {
  maxArea: number;
  targetCols: number;
  targetRows: number;
  targetHeight: number;
  targetWidth: number;
  ratio: number;
}

function getBestDimensions(
  minRatio: number,
  maxRatio: number,
  Width: number,
  Height: number,
  count: number,
): Dimension {
  let maxArea: number;
  let targetCols: number;
  let targetRows: number;
  let targetHeight: number;
  let targetWidth: number;
  let tWidth: number;
  let tHeight: number;
  let tRatio: number;

  // Iterate through every possible combination of rows and columns
  // and see which one has the least amount of whitespace
  for (let i = 1; i <= count; i += 1) {
    const cols = i;
    const rows = Math.ceil(count / cols);

    // Try taking up the whole height and width
    tHeight = Math.floor(Height / rows);
    tWidth = Math.floor(Width / cols);

    tRatio = tHeight / tWidth;
    if (tRatio > maxRatio) {
      // We went over decrease the height
      tRatio = maxRatio;
      tHeight = tWidth * tRatio;
    } else if (tRatio < minRatio) {
      // We went under decrease the width
      tRatio = minRatio;
      tWidth = tHeight / tRatio;
    }

    const area = tWidth * tHeight * count;

    // If this width and height takes up the most space then we're going with that
    if (maxArea === undefined || area > maxArea) {
      maxArea = area;
      targetHeight = tHeight;
      targetWidth = tWidth;
      targetCols = cols;
      targetRows = rows;
    }
  }
  return {
    maxArea,
    targetCols,
    targetRows,
    targetHeight,
    targetWidth,
    ratio: targetHeight / targetWidth,
  };
}

interface LayoutItem {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getLayout(opts, items: readonly Item[]): LayoutItem[] {
  const {
    maxRatio,
    minRatio,
    fixedRatio,
    containerWidth,
    containerHeight,
    offsetLeft = 0,
    offsetTop = 0,
    alignItems = 'center',
  } = opts;
  const ratios = items.map((item) => item.height / item.width);
  const count = ratios.length;

  let dimensions: Dimension;

  if (!fixedRatio) {
    dimensions = getBestDimensions(
      minRatio,
      maxRatio,
      containerWidth,
      containerHeight,
      count,
    );
  } else {
    // Use the ratio of the first video element we find to approximate
    const ratio = ratios.length > 0 ? ratios[0] : null;
    dimensions = getBestDimensions(
      ratio,
      ratio,
      containerWidth,
      containerHeight,
      count,
    );
  }

  // Loop through each stream in the container and place it inside
  let x = 0;
  let y = 0;
  const rows: {
    ratios: number[];
    width: number;
    height: number;
  }[] = [];
  let row;
  const boxes = [];
  // Iterate through the children and create an array with a new item for each row
  // and calculate the width of each row so that we know if we go over the size and need
  // to adjust
  for (let i = 0; i < ratios.length; i += 1) {
    if (i % dimensions.targetCols === 0) {
      // This is a new row
      row = {
        ratios: [],
        width: 0,
        height: 0,
      };
      rows.push(row);
    }
    const ratio = ratios[i];
    row.ratios.push(ratio);
    let targetWidth = dimensions.targetWidth;
    const targetHeight = dimensions.targetHeight;
    // If we're using a fixedRatio then we need to set the correct ratio for this element
    if (fixedRatio) {
      targetWidth = targetHeight / ratio;
    }
    row.width += targetWidth;
    row.height = targetHeight;
  }
  // Calculate total row height adjusting if we go too wide
  let totalRowHeight = 0;
  let remainingShortRows = 0;
  for (let i = 0; i < rows.length; i += 1) {
    row = rows[i];
    if (row.width > containerWidth) {
      // Went over on the width, need to adjust the height proportionally
      row.height = Math.floor(row.height * (containerWidth / row.width));
      row.width = containerWidth;
    } else if (row.width < containerWidth) {
      remainingShortRows += 1;
    }
    totalRowHeight += row.height;
  }
  if (totalRowHeight < containerHeight && remainingShortRows > 0) {
    // We can grow some of the rows, we're not taking up the whole height
    let remainingHeightDiff = containerHeight - totalRowHeight;
    totalRowHeight = 0;
    for (let i = 0; i < rows.length; i += 1) {
      row = rows[i];
      if (row.width < containerWidth) {
        // Evenly distribute the extra height between the short rows
        let extraHeight = remainingHeightDiff / remainingShortRows;
        if (
          extraHeight / row.height >
          (containerWidth - row.width) / row.width
        ) {
          // We can't go that big or we'll go too wide
          extraHeight = Math.floor(
            ((containerWidth - row.width) / row.width) * row.height,
          );
        }
        row.width += Math.floor((extraHeight / row.height) * row.width);
        row.height += extraHeight;
        remainingHeightDiff -= extraHeight;
        remainingShortRows -= 1;
      }
      totalRowHeight += row.height;
    }
  }
  switch (alignItems) {
    case 'start':
      y = 0;
      break;
    case 'end':
      y = containerHeight - totalRowHeight;
      break;
    case 'center':
    default:
      y = (containerHeight - totalRowHeight) / 2;
      break;
  }
  // Iterate through each row and place each child
  for (let i = 0; i < rows.length; i += 1) {
    row = rows[i];
    let rowMarginLeft: number;
    switch (alignItems) {
      case 'start':
        rowMarginLeft = 0;
        break;
      case 'end':
        rowMarginLeft = containerWidth - row.width;
        break;
      case 'center':
      default:
        rowMarginLeft = (containerWidth - row.width) / 2;
        break;
    }
    x = rowMarginLeft;
    let targetHeight;
    for (let j = 0; j < row.ratios.length; j += 1) {
      const ratio = row.ratios[j];

      let targetWidth = dimensions.targetWidth;
      targetHeight = row.height;
      // If we're using a fixedRatio then we need to set the correct ratio for this element
      if (fixedRatio) {
        targetWidth = Math.floor(targetHeight / ratio);
      } else if (
        targetHeight / targetWidth !==
        dimensions.targetHeight / dimensions.targetWidth
      ) {
        // We grew this row, we need to adjust the width to account for the increase in height
        targetWidth = Math.floor(
          (dimensions.targetWidth / dimensions.targetHeight) * targetHeight,
        );
      }

      boxes.push({
        left: x + offsetLeft,
        top: y + offsetTop,
        width: targetWidth,
        height: targetHeight,
      });
      x += targetWidth;
    }
    y += targetHeight;
  }
  return boxes;
}

function getVideoRatio(item: Item) {
  return item.height / item.width;
}

interface LayoutOptions {
  alignItems: 'center'; // Can be 'start', 'center' or 'end'. Determines where to place items when on a row or column that is not full
  bigAlignItems: 'center'; // How to align the big items
  bigFirst: boolean; // Whether to place the big one in the top left (true) or bottom right
  bigFixedRatio: boolean; // fixedRatio for the big ones
  bigMaxRatio: number; // The narrowest ratio to use for the big elements (default 2x3)
  bigMinRatio: number; // The widest ratio to use for the big elements (default 16x9)
  bigPercentage: number; // The maximum percentage of space the big ones should take up
  fixedRatio: boolean; // If this is true then the aspect ratio of the video is maintained and minRatio and maxRatio are ignored (default false)

  containerHeight: number;
  containerWidth: number;

  maxRatio: number; // The narrowest ratio that will be used (default 2x3)
  minRatio: number; // The widest ratio that will be used (default 16x9)
  smallAlignItems: 'center'; // How to align the small row or column of items if there is a big one
}

const defaultOptions: LayoutOptions = {
  alignItems: 'center',
  bigAlignItems: 'center',
  bigFirst: true,
  bigFixedRatio: false,
  bigMaxRatio: 3 / 2,
  bigMinRatio: 9 / 16,
  bigPercentage: 0.8,

  containerWidth: 640,
  containerHeight: 480,

  fixedRatio: false,
  maxRatio: 3 / 2,
  minRatio: 9 / 16,
  smallAlignItems: 'center',
};

export function computeLayout(
  opts: Partial<LayoutOptions>,
  items: readonly Item[],
) {
  const fullOpts: LayoutOptions = { ...defaultOptions, ...opts };

  const {
    alignItems,
    bigAlignItems,
    bigFirst,
    bigFixedRatio,
    bigMaxRatio,
    bigMinRatio,
    bigPercentage,
    containerHeight,
    containerWidth,
    fixedRatio,
    maxRatio,
    minRatio,
    smallAlignItems,
  } = fullOpts;

  const availableRatio = containerHeight / containerWidth;
  let offsetLeft = 0;
  let offsetTop = 0;
  let bigOffsetTop = 0;
  let bigOffsetLeft = 0;
  const bigIndices = [];
  const bigOnes = items.filter((item, idx) => {
    if (item.big) {
      bigIndices.push(idx);
      return true;
    }
    return false;
  });
  const smallOnes = items.filter((item) => !item.big);
  let bigBoxes: LayoutItem[] = [];
  let smallBoxes: LayoutItem[] = [];
  if (bigOnes.length > 0 && smallOnes.length > 0) {
    let bigWidth;
    let bigHeight;

    if (availableRatio > getVideoRatio(bigOnes[0])) {
      // We are tall, going to take up the whole width and arrange small
      // guys at the bottom
      bigWidth = containerWidth;
      bigHeight = Math.floor(containerHeight * bigPercentage);
      offsetTop = bigHeight;
      bigOffsetTop = containerHeight - offsetTop;
    } else {
      // We are wide, going to take up the whole height and arrange the small
      // guys on the right
      bigHeight = containerHeight;
      bigWidth = Math.floor(containerWidth * bigPercentage);
      offsetLeft = bigWidth;
      bigOffsetLeft = containerWidth - offsetLeft;
    }
    if (bigFirst) {
      bigBoxes = getLayout(
        {
          containerWidth: bigWidth,
          containerHeight: bigHeight,
          offsetLeft: 0,
          offsetTop: 0,
          fixedRatio: bigFixedRatio,
          minRatio: bigMinRatio,
          maxRatio: bigMaxRatio,
          alignItems: bigAlignItems,
        },
        bigOnes,
      );
      smallBoxes = getLayout(
        {
          containerWidth: containerWidth - offsetLeft,
          containerHeight: containerHeight - offsetTop,
          offsetLeft,
          offsetTop,
          fixedRatio,
          minRatio,
          maxRatio,
          alignItems: smallAlignItems,
        },
        smallOnes,
      );
    } else {
      smallBoxes = getLayout(
        {
          containerWidth: containerWidth - offsetLeft,
          containerHeight: containerHeight - offsetTop,
          offsetLeft: 0,
          offsetTop: 0,
          fixedRatio,
          minRatio,
          maxRatio,
          alignItems: smallAlignItems,
        },
        smallOnes,
      );
      bigBoxes = getLayout(
        {
          containerWidth: bigWidth,
          containerHeight: bigHeight,
          offsetLeft: bigOffsetLeft,
          offsetTop: bigOffsetTop,
          fixedRatio: bigFixedRatio,
          minRatio: bigMinRatio,
          alignItems: bigAlignItems,
        },
        bigOnes,
      );
    }
  } else if (bigOnes.length > 0 && smallOnes.length === 0) {
    // We only have one bigOne just center it
    bigBoxes = getLayout(
      {
        containerWidth,
        containerHeight,
        fixedRatio: bigFixedRatio,
        minRatio: bigMinRatio,
        maxRatio: bigMaxRatio,
        alignItems: bigAlignItems,
      },
      bigOnes,
    );
  } else {
    smallBoxes = getLayout(
      {
        containerWidth: containerWidth - offsetLeft,
        containerHeight: containerHeight - offsetTop,
        offsetLeft,
        offsetTop,
        fixedRatio,
        minRatio,
        maxRatio,
        alignItems,
      },
      smallOnes,
    );
  }

  const boxes: LayoutItem[] = [];
  let bigBoxesIdx = 0;
  let smallBoxesIdx = 0;
  // Rebuild the array in the right order based on where the bigIndices should be
  items.forEach((_item, idx) => {
    if (bigIndices.indexOf(idx) > -1) {
      boxes[idx] = bigBoxes[bigBoxesIdx];
      bigBoxesIdx += 1;
    } else {
      boxes[idx] = smallBoxes[smallBoxesIdx];
      smallBoxesIdx += 1;
    }
  });
  return boxes;
}
