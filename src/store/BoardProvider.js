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

/**
 * Initial state for the drawing board
 * Contains all necessary data to manage the drawing experience
 */
const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH, // Default tool is brush
  toolActionType: TOOL_ACTION_TYPES.NONE, // No action initially
  elements: [], // List of drawn elements
  history: [[]], // History of states for undo/redo (2D array of element states)
  index: 0, // Current index in the history array
  selectedElement: null, // Currently selected element for manipulation
};

/**
 * Reducer function to manage board state transitions
 * Uses a switch statement to handle different action types
 * 
 * @param {Object} state - Current board state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} - Updated board state
 */
const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      // Change the active drawing tool (brush, line, rectangle, etc.)
      return { ...state, activeToolItem: action.payload.tool };

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      // Change the current interaction mode (drawing, writing, erasing, etc.)
      return { ...state, toolActionType: action.payload.actionType };

    case BOARD_ACTIONS.DRAW_DOWN: {
      // Start drawing a new element when mouse/pointer is pressed down
      const id = state.elements.length; // Assign a unique ID based on array length
      const { clientX, clientY, size, strokeColor, fillColor } = action.payload;
      
      // Create new element at initial position
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
      
      // Add the new element to existing elements
      const newElements = [...state.elements, newElement];
      
      // Update state with new element and appropriate action type
      return {
        ...state,
        elements: newElements,
        // Set action type based on whether tool is drawing or text tool
        toolActionType: DRAW_TOOL_ITEMS.includes(state.activeToolItem)
          ? TOOL_ACTION_TYPES.DRAWING
          : TOOL_ACTION_TYPES.WRITING,
        selectedElement: newElement, // Set as selected element
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      // Update element dimensions as mouse/pointer moves
      const { clientX, clientY } = action.payload;
      const index = state.elements.length - 1; // Get last element (currently being drawn)
      const { x1, y1, type, stroke, text, fill, size } = state.elements[index];
      
      // Update the element with new end coordinates
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
      // Finalize drawing when mouse/pointer is released
      const elements = state.elements;
      
      // Update history stack for undo/redo functionality
      let newHistory = state.history;
      newHistory = newHistory.slice(0, state.index + 1); // Remove any future history (after undos)
      newHistory.push(elements); // Add current state to history
      
      return {
        ...state,
        history: newHistory,
        index: newHistory.length - 1, // Set index to latest history entry
      };
    }

    case BOARD_ACTIONS.ERASE: {
      // Remove elements at the specified point
      const { clientX, clientY } = action.payload;
      
      // Filter out elements that intersect with eraser position
      const newElements = state.elements.filter((ele) => {
        return !isPointNearElement(ele, {
          pointX: clientX,
          pointY: clientY,
        });
      });
      
      // Only update state if something was actually erased
      if (newElements.length === state.elements.length) return state;
      
      const prevIndex = state.index;
      return {
        ...state,
        elements: newElements,
        history: [...state.history, newElements], // Add new state to history
        index: prevIndex + 1,
        toolActionType: TOOL_ACTION_TYPES.ERASING,
      };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      // Update text content of a text element
      const index = state.selectedElement.id;
      const elements = state.elements;
      const { x1, y1, id, type } = elements[index];
      
      // Create updated text element
      const newEle = createRoughElement(id, x1, y1, null, null, {
        type,
        text: action.payload.text,
        stroke: action.payload.strokeColor,
        size: action.payload.size,
      });
      
      // Replace old element with updated one
      const elementsCopy = [...state.elements];
      elementsCopy[id] = newEle;
      
      const prevIndex = state.index;
      return {
        ...state,
        elements: elementsCopy,
        history: [...state.history, elementsCopy], // Add to history
        index: prevIndex + 1,
      };
    }

    case BOARD_ACTIONS.UNDO: {
      // Revert to previous state in history
      if (state.index <= 0) return state; // Can't undo if at first state
      
      const prevElements = state.history[state.index - 1];
      return {
        ...state,
        elements: prevElements,
        index: state.index - 1,
      };
    }

    case BOARD_ACTIONS.REDO: {
      // Go forward to next state in history (after undo)
      if (state.index >= state.history.length - 1) return state; // Can't redo if at latest state
      
      const nextElements = state.history[state.index + 1];
      return {
        ...state,
        elements: nextElements,
        index: state.index + 1,
      };
    }

    default: {
      // Handle unknown action types by returning unchanged state
      return state;
    }
  }
};

/**
 * React Context Provider for the drawing board
 * Manages state and provides event handlers to child components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - Context provider component
 */
export const BoardContextProvider = ({ children }) => {
  // Initialize board state with useReducer hook
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState
  );

  /**
   * Handler to change the active drawing tool
   * 
   * @param {string} tool - The tool identifier to switch to
   */
  const changeToolHandler = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: { tool },
    });
  };

  /**
   * Handler for mouse down events on the board
   * Initiates drawing or erasing based on active tool
   * 
   * @param {MouseEvent} event - Mouse event object
   * @param {Object} toolboxState - Current state of the toolbox (colors, sizes)
   */
  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;

    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      // Handle eraser tool specifically
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    
    // For all other tools, start drawing
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

  /**
   * Handler for mouse move events on the board
   * Updates drawing or performs erasing based on current action type
   * 
   * @param {MouseEvent} event - Mouse event object
   */
  const boardMouseMoveHandler = (event) => {
    const { clientX, clientY } = event;
    
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      // Continue drawing the current element
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      // Continue erasing elements
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX,
          clientY,
        },
      });
    }
  };

  /**
   * Handler for mouse up events on the board
   * Finalizes drawing and resets action state
   */
  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      // Finalize the current drawing operation
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
    }
    
    // Reset to neutral action state
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  /**
   * Handler for when the text area loses focus
   * Saves text content and resets action state
   * 
   * @param {FocusEvent} event - Focus event from textarea
   * @param {Object} toolboxState - Current state of the toolbox
   */
  const textAreaBlurHandler = (event, toolboxState) => {
    // Update text content with the value from textarea
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text: event.target.value,
        strokeColor: toolboxState[boardState.activeToolItem]?.stroke,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
    
    // Reset action type after text input
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  /**
   * Handler for undo action
   * Reverts to previous state in history
   */
  const boardUndoHandler = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  };

  /**
   * Handler for redo action
   * Advances to next state in history after undo
   */
  const boardRedoHandler = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  };

  // Create context value object with all state and handlers
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

  // Provide context to all children
  return (
    <BoardContext.Provider value={boardContext}>
      {children}
    </BoardContext.Provider>
  );
};
