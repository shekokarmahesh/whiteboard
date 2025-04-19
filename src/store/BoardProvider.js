import { useReducer } from "react";
import {
  BOARD_ACTIONS,
  DRAW_TOOL_ITEMS,
  TOOL_ACTION_TYPES,
  TOOL_ITEMS,
} from "../constants";
import {
  createRoughElement,
  getUpdatedElements,
  isPointNearElement,
} from "../utils/element";
import BoardContext from "./board-context";

// Initial state for the board
const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH, // Default tool is brush
  toolActionType: TOOL_ACTION_TYPES.NONE, // No action initially
  elements: [], // List of drawn elements
  history: [[]], // History of states for undo/redo
  index: 0, // Current index in the history
  selectedElement: null, // Currently selected element
};

// Reducer function to handle state transitions
const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      // Change the active tool
      return { ...state, activeToolItem: action.payload.tool };

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      // Change the current action type
      return { ...state, toolActionType: action.payload.actionType };

    case BOARD_ACTIONS.DRAW_DOWN: {
      // Start drawing a new element
      const id = state.elements.length; // Assign a unique ID
      const { clientX, clientY, size, strokeColor, fillColor } = action.payload;
      const newElement = createRoughElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        {
          type: state.activeToolItem,
          stroke: strokeColor,
          fill: fillColor,
          size,
        }
      );
      const newElements = [...state.elements, newElement];
      return {
        ...state,
        elements: newElements,
        toolActionType: DRAW_TOOL_ITEMS.includes(state.activeToolItem)
          ? TOOL_ACTION_TYPES.DRAWING
          : TOOL_ACTION_TYPES.WRITING,
        selectedElement: newElement,
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      // Update the element being drawn as the mouse moves
      const { clientX, clientY } = action.payload;
      const index = state.elements.length - 1; // Last element being drawn
      const { x1, y1, type, stroke, text, fill, size } = state.elements[index];
      return {
        ...state,
        elements: getUpdatedElements(
          state.elements,
          index,
          x1,
          y1,
          clientX,
          clientY,
          {
            type,
            text,
            stroke,
            fill,
            size,
          }
        ),
      };
    }

    case BOARD_ACTIONS.DRAW_UP: {
      // Finalize the drawing and update history
      const elements = state.elements;
      let newHistory = state.history; // 2D array for history
      newHistory = newHistory.slice(0, state.index + 1); // Remove future states
      newHistory.push(elements); // Add current state to history
      return {
        ...state,
        history: newHistory,
        index: newHistory.length - 1, // Update index to the latest state
      };
    }

    case BOARD_ACTIONS.ERASE: {
      // Erase elements near the given point
      const { clientX, clientY } = action.payload;
      const newElements = state.elements.filter((ele) => {
        return !isPointNearElement(ele, {
          pointX: clientX,
          pointY: clientY,
        });
      });
      if (newElements.length === state.elements.length) return state; // No change
      const prevIndex = state.index;
      return {
        ...state,
        elements: newElements,
        history: [...state.history, newElements], // Update history
        index: prevIndex + 1,
        toolActionType: TOOL_ACTION_TYPES.ERASING,
      };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      // Update the text of the selected element
      const index = state.selectedElement.id;
      const elements = state.elements;
      const { x1, y1, id, type } = elements[index];
      const newEle = createRoughElement(id, x1, y1, null, null, {
        type,
        text: action.payload.text,
        stroke: action.payload.strokeColor,
        size: action.payload.size,
      });
      const elementsCopy = [...state.elements];
      elementsCopy[id] = newEle;
      const prevIndex = state.index;
      return {
        ...state,
        elements: elementsCopy,
        history: [...state.history, elementsCopy], // Update history
        index: prevIndex + 1,
      };
    }

    case BOARD_ACTIONS.UNDO: {
      // Undo the last action
      if (state.index <= 0) return state; // No more undo
      const prevElements = state.history[state.index - 1];
      return {
        ...state,
        elements: prevElements,
        index: state.index - 1,
      };
    }

    case BOARD_ACTIONS.REDO: {
      // Redo the next action
      if (state.index >= state.history.length - 1) return state; // No more redo
      const nextElements = state.history[state.index + 1];
      return {
        ...state,
        elements: nextElements,
        index: state.index + 1,
      };
    }

    default: {
      // Return the current state for unknown actions
      return state;
    }
  }
};

// Context provider for the board
export const BoardContextProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState
  );

  // Handler to change the active tool
  const changeToolHandler = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: { tool },
    });
  };

  // Handler for mouse down events on the board
  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;

    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      // Switch to erasing mode
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    // Start drawing
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        strokeColor: toolboxState[boardState.activeToolItem]?.stroke,
        fillColor: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  // Handler for mouse move events on the board
  const boardMouseMoveHandler = (event) => {
    const { clientX, clientY } = event;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      // Update the drawing
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      // Erase elements
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX,
          clientY,
        },
      });
    }
  };

  // Handler for mouse up events on the board
  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      // Finalize the drawing
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
    }
    // Reset the action type
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  // Handler for when the text area loses focus
  const textAreaBlurHandler = (event, toolboxState) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text: event.target.value,
        strokeColor: toolboxState[boardState.activeToolItem]?.stroke,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  // Handler for undo action
  const boardUndoHandler = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  };

  // Handler for redo action
  const boardRedoHandler = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  };

  // Context value to be provided to consumers
  const boardContext = {
    activeToolItem: boardState.activeToolItem,
    toolActionType: boardState.toolActionType,
    elements: boardState.elements,
    history: boardState.history,
    index: boardState.index,
    selectedElement: boardState.selectedElement,
    changeTool: changeToolHandler,
    boardMouseDown: boardMouseDownHandler,
    boardMouseMove: boardMouseMoveHandler,
    boardMouseUp: boardMouseUpHandler,
    textAreaBlur: textAreaBlurHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
  };

  return (
    <BoardContext.Provider value={boardContext}>
      {children}
    </BoardContext.Provider>
  );
};
