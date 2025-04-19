import { ELEMENT_ERASE_THRESHOLDS } from "../constants";

// Checks if a point is close to a line segment defined by two points (x1, y1) and (x2, y2)
export const isPointCloseToLine = (x1, y1, x2, y2, pointX, pointY) => {
  const distToStart = distanceBetweenPoints(x1, y1, pointX, pointY); // Distance from point to start of the line
  const distToEnd = distanceBetweenPoints(x2, y2, pointX, pointY); // Distance from point to end of the line
  const distLine = distanceBetweenPoints(x1, y1, x2, y2); // Length of the line segment
  return (
    Math.abs(distToStart + distToEnd - distLine) < ELEMENT_ERASE_THRESHOLDS.LINE
  ); // Check if the sum of distances is approximately equal to the line length
};

// Checks if a point (x, y) is near another point (x1, y1) within a threshold of 5 units
export const isNearPoint = (x, y, x1, y1) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5;
};

// Calculates the coordinates of the arrowhead points for a line segment
export const getArrowHeadsCoordinates = (x1, y1, x2, y2, arrowLength) => {
  const angle = Math.atan2(y2 - y1, x2 - x1); // Angle of the line segment

  // Coordinates for the first arrowhead point
  const x3 = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
  const y3 = y2 - arrowLength * Math.sin(angle - Math.PI / 6);

  // Coordinates for the second arrowhead point
  const x4 = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
  const y4 = y2 - arrowLength * Math.sin(angle + Math.PI / 6);

  return {
    x3,
    y3,
    x4,
    y4,
  };
};

// Calculates the midpoint between two points p1 and p2
export const midPointBtw = (p1, p2) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2, // Midpoint x-coordinate
    y: p1.y + (p2.y - p1.y) / 2, // Midpoint y-coordinate
  };
};

// Helper function to calculate the distance between two points (x1, y1) and (x2, y2)
const distanceBetweenPoints = (x1, y1, x2, y2) => {
  const dx = x2 - x1; // Difference in x-coordinates
  const dy = y2 - y1; // Difference in y-coordinates
  return Math.sqrt(dx * dx + dy * dy); // Euclidean distance
};
