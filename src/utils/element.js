// Import required libraries and utilities
import rough from "roughjs/bin/rough"; // Library for creating hand-drawn sketchy graphics
import getStroke from "perfect-freehand"; // Library for creating smooth freehand drawing strokes
import { ARROW_LENGTH, TOOL_ITEMS } from "../constants"; // App constants for drawing tools
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./math"; // Math utility functions

// Initialize the rough.js generator for creating sketch-style elements
const gen = rough.generator();

/**
 * Creates a drawing element based on the specified tool type and parameters
 * 
 * @param {number} index - Unique identifier for the element
 * @param {number} x1 - Starting X coordinate
 * @param {number} y1 - Starting Y coordinate
 * @param {number} x2 - Ending X coordinate
 * @param {number} y2 - Ending Y coordinate
 * @param {Object} options - Element properties
 * @param {string} options.type - Tool type (brush, line, rectangle, circle, arrow, text)
 * @param {string} options.text - Text content (for text elements)
 * @param {string} options.stroke - Stroke color
 * @param {string} options.fill - Fill color
 * @param {number} options.size - Stroke width
 * @returns {Object} - Created element with appropriate properties
 */
export const createRoughElement = (
  index,
  x1,
  y1,
  x2,
  y2,
  { type, text, stroke, fill, size }
) => {
  // Initialize rough element and default options
  let roughEle = {},
    options = {
      seed: index + 1, // Seed can't be zero, so add 1 to index
      strokeWidth: 3,   // Default stroke width
    };
  
  // Configure options based on provided parameters
  if (stroke && stroke.length > 0) options.stroke = stroke;
  if (fill && fill.length > 0) {
    options.fill = fill;
    options.fillStyle = "solid";
  }
  if (size) options.strokeWidth = size;

  // Create appropriate element based on tool type
  if (type === TOOL_ITEMS.BRUSH) {
    // Create a brush stroke with a single point initially
    return {
      id: index,
      points: [{ x: x1, y: y1 }],
      path: new Path2D(getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }]))),
      type,
      stroke,
      size,
    };
  } else if (type === TOOL_ITEMS.LINE) {
    // Create a straight line
    roughEle = gen.line(x1, y1, x2, y2, options);
    return { id: index, x1, y1, x2, y2, roughEle, type, stroke, size };
  } else if (type === TOOL_ITEMS.RECTANGLE) {
    // Create a rectangle
    roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
    return { id: index, x1, y1, x2, y2, roughEle, type, stroke, fill, size };
  } else if (type === TOOL_ITEMS.CIRCLE) {
    // Create an ellipse (circle) with calculated center and dimensions
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const width = x2 - x1,
      height = y2 - y1,
      roughEle = gen.ellipse(cx, cy, width, height, options);
    return {
      id: index,
      x1,
      y1,
      x2,
      y2,
      roughEle,
      type,
      width,
      height,
      centerX: cx,
      centerY: cy,
      stroke,
      fill,
      size,
    };
  } else if (type === TOOL_ITEMS.ARROW) {
    // Create an arrow with arrowhead coordinates
    const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
      x1,
      y1,
      x2,
      y2,
      ARROW_LENGTH
    );
    const points = [
      [x1, y1],
      [x2, y2],
      [x3, y3],
      [x2, y2],
      [x4, y4],
    ];
    roughEle = gen.linearPath(points, options);
    return { id: index, x1, y1, x2, y2, roughEle, type, stroke, size };
  } else if (type === TOOL_ITEMS.TEXT) {
    // Create a text element
    if (!text) text = "";
    return {
      id: index,
      type,
      x1,
      y1,
      x2,
      y2,
      textEle: {
        text,
        stroke,
        size,
      },
    };
  } else {
    // Handle unknown tool types
    throw new Error(`Type not recognized ${type}`);
  }
};

/**
 * Draws an element on the canvas
 * 
 * @param {Object} roughCanvas - RoughJS canvas instance
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {Object} element - Element to be drawn
 */
export const drawElement = (roughCanvas, context, element) => {
  switch (element.type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
    case TOOL_ITEMS.ARROW:
      // Draw rough.js elements using the rough canvas
      roughCanvas.draw(element.roughEle);
      break;
    case TOOL_ITEMS.BRUSH:
      // Draw brush stroke using canvas path
      context.fillStyle = element.stroke;
      context.fill(element.path);
      context.restore();
      break;
    case TOOL_ITEMS.TEXT:
      // Draw text using canvas text APIs
      context.textBaseline = "top";
      context.font = `${element.textEle.size}px Caveat`;
      context.fillStyle = element.textEle.stroke;
      context.fillText(element.textEle.text, element.x1, element.y1);
      context.restore();
      break;
    default:
      throw new Error(`Type not recognized ${element.type}`);
  }
};

/**
 * Updates elements when they are manipulated (e.g., resizing)
 * 
 * @param {Array} elements - All drawing elements
 * @param {number} id - ID of the element being updated
 * @param {number} x1 - New starting X coordinate
 * @param {number} y1 - New starting Y coordinate
 * @param {number} x2 - New ending X coordinate
 * @param {number} y2 - New ending Y coordinate
 * @param {Object} options - Element properties
 * @returns {Array} - Updated elements array
 */
export const getUpdatedElements = (
  elements,
  id,
  x1,
  y1,
  x2,
  y2,
  { type, text, stroke, fill, size }
) => {
  const elementsCopy = [...elements];
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
    case TOOL_ITEMS.ARROW:
      // Recreate shape elements with new coordinates
      const { x1, y1, type, text, stroke, fill, size } = elements[id];
      elementsCopy[id] = createRoughElement(id, x1, y1, x2, y2, {
        type,
        text,
        stroke,
        fill,
        size,
      });
      return elementsCopy;
    case TOOL_ITEMS.BRUSH:
      // Add a new point to the brush stroke and recalculate the path
      elementsCopy[id].points = [...elements[id].points, { x: x2, y: y2 }];
      elementsCopy[id].path = new Path2D(
        getSvgPathFromStroke(getStroke(elementsCopy[id].points))
      );
      return elementsCopy;
    case TOOL_ITEMS.TEXT:
      // Text element handling (incomplete implementation)
      break;
    default:
      throw new Error(`Type not recognized ${type}`);
  }
};

/**
 * Adjusts element coordinates to ensure x1,y1 is always the top-left point
 * and x2,y2 is always the bottom-right point
 * 
 * @param {Object} element - Element to adjust
 * @returns {Object} - Element with normalized coordinates
 */
export const adjustElementCoordinates = (element) => {
  const { x1, y1, x2, y2 } = element;
  if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return { x1, y1, x2, y2 };
  } else {
    return { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
};

/**
 * Checks if a point is close to or within an element (for selection)
 * 
 * @param {Object} element - Element to check against
 * @param {Object} point - Coordinates to test
 * @param {number} point.pointX - X coordinate
 * @param {number} point.pointY - Y coordinate
 * @returns {boolean} - True if the point is near the element
 */
export const isPointNearElement = (element, { pointX, pointY }) => {
  const { x1, y1, x2, y2, type } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      // Check if point is close to the line
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
      // Check if point is close to any of the four sides of the rectangle
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.CIRCLE:
      // Check if point is close to the bounding box of the circle/ellipse
      const { centerX, centerY, width, height } = element;
      const rectx1 = centerX - width / 2,
        recty1 = centerY - height / 2;
      const rectx2 = centerX + width / 2,
        recty2 = centerY - height / 2;
      const rectx3 = centerX + width / 2,
        recty3 = centerY + height / 2;
      const rectx4 = centerX - width / 2,
        recty4 = centerY + height / 2;
      return (
        isPointCloseToLine(rectx1, recty1, rectx2, recty2, pointX, pointY) ||
        isPointCloseToLine(rectx2, recty2, rectx3, recty3, pointX, pointY) ||
        isPointCloseToLine(rectx3, recty3, rectx4, recty4, pointX, pointY) ||
        isPointCloseToLine(rectx4, recty4, rectx1, recty1, pointX, pointY)
      );
    case TOOL_ITEMS.TEXT:
      // Check if point is close to the bounding box of the text
      context.font = `${element.textEle.size}px Caveat`;
      context.fillStyle = element.textEle.stroke;
      const textWidth = context.measureText(element.textEle.text).width;
      const textHeight = parseInt(element.textEle.size);
      context.restore();
      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1,
          x1 + textWidth,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1 + textHeight,
          x1,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH:
      // Check if point is within the brush stroke path
      return context.isPointInPath(element.path, pointX, pointY);
    default:
      throw new Error(`Type not recognized ${type}`);
  }
};

/**
 * Converts stroke data from perfect-freehand into an SVG path string
 * 
 * @param {Array} stroke - Array of stroke points from perfect-freehand
 * @returns {string} - SVG path data string
 */
const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  // Create an SVG path string from the stroke points
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z"); // Close the path
  return d.join(" ");
};
