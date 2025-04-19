<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Virtual Whiteboard

A modern, interactive virtual whiteboard application built with React. This web-based tool provides a digital canvas for drawing, sketching, and collaborating in real-time.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
    - [Component Structure](#component-structure)
    - [State Management](#state-management)
    - [Drawing Logic](#drawing-logic)
    - [Element Types](#element-types)
- [Implementation Details](#implementation-details)
    - [Drawing Process](#drawing-process)
    - [Element Selection and Manipulation](#element-selection-and-manipulation)
    - [History Management](#history-management)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Key Files](#key-files)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Virtual Whiteboard** is a feature-rich drawing application that mimics the functionality of a physical whiteboard in a digital environment. It leverages modern web technologies to provide a smooth and responsive drawing experience with various tools including freehand drawing, geometric shapes, text annotations, and more.

---

## Features

- **Multiple Drawing Tools:**
    - Brush tool for freehand drawing
    - Line tool for straight lines
    - Rectangle and Circle tools for geometric shapes
    - Arrow tool for directional indicators
    - Text tool for annotations
    - Eraser tool for corrections
- **Customization Options:**
    - Color picker for stroke and fill colors
    - Customizable stroke width
    - Font size adjustment for text
    - Fill options for shapes
- **Canvas Operations:**
    - Undo/Redo functionality
    - Download canvas as PNG image
    - Keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo)
- **Interactive UI:**
    - Toolbar for quick access to drawing tools
    - Contextual toolbox that changes based on selected tool
    - Modern, responsive interface using Tailwind CSS

---

## Tech Stack

- **React 18** – UI library
- **Tailwind CSS** – Utility-first CSS framework
- **perfect-freehand** – For smooth brush strokes
- **Rough.js** – For hand-drawn, sketchy geometric shapes
- **React Icons** – SVG icon library
- **ClassNames** – Conditional class name utility

---

## Architecture

### Component Structure

- **App.js** – Root component that sets up context providers
- **Board** – Canvas component handling drawing and rendering
- **Toolbar** – Tool selection component at the top of the screen
- **Toolbox** – Contextual tools panel on the left side


### State Management

The application uses React Context API for state management:

- **BoardContext** – Manages drawing state, active tool, element history
- **ToolboxContext** – Manages tool-specific settings (colors, sizes)


### Drawing Logic

- Elements are rendered on an HTML Canvas
- [`roughjs`](https://github.com/rough-stuff/rough) creates sketchy, hand-drawn style graphics
- [`perfect-freehand`](https://github.com/steveruizok/perfect-freehand) enables smooth brush drawing
- Custom math utilities handle geometric calculations


### Element Types

The application supports multiple element types:

- Brush strokes using Path2D
- Lines, Rectangles, and Circles using Rough.js
- Arrows with custom head calculations
- Text with custom font styling

---

## Implementation Details

### Drawing Process

1. Mouse down initiates element creation
2. Mouse move updates element dimensions
3. Mouse up finalizes the element and adds to history
4. Canvas is redrawn with all elements on each update

### Element Selection and Manipulation

Elements can be selected based on proximity detection to mouse cursor:

- Line proximity detection uses distance-to-line calculations
- Shape proximity uses bounding box detection
- Text uses font metrics for accurate bounding
- Brush uses Path2D.isPointInPath for precise detection


### History Management

- Drawing operations are stored in a history stack
- Undo/Redo navigate through this stack
- State is preserved between operations

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)


### Installation

1. **Clone the repository:**

```bash
git clone [your-repository-url]
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start the development server:**

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

- `npm start` – Runs the app in development mode
- `npm test` – Launches the test runner
- `npm run build` – Builds the app for production
- `npm run eject` – Ejects from Create React App

---

## Project Structure

```
src/
├── components/     # React components
│   ├── Board/      # Canvas and drawing logic
│   ├── Toolbar/    # Tool selection component
│   └── Toolbox/    # Tool options component
├── store/         # State management with Context API
│   ├── board-context.js      # Canvas state context
│   ├── BoardProvider.js      # Canvas state provider
│   ├── toolbox-context.js    # Tool options context
│   └── ToolboxProvider.js    # Tool options provider
├── utils/         # Utility functions
│   ├── element.js  # Element creation and manipulation
│   └── math.js     # Geometric calculations
├── constants.js   # Application constants and enums
├── App.js         # Main application component
└── index.js       # Application entry point
```

---

## Key Files

- `utils/element.js` – Core drawing element creation and rendering
- `utils/math.js` – Mathematical utilities for geometry
- `store/BoardProvider.js` – Main drawing state logic
- `components/Board/index.js` – Canvas handling and event binding

---

## Future Enhancements

- Collaborative real-time drawing
- Layers support
- Selection and transformation of existing elements
- More shape options (triangles, polygons)
- Image import/export capabilities
- Cloud storage integration

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License – see the LICENSE file for details.

---

*Inspired by the best of digital and physical whiteboarding experiences.*

