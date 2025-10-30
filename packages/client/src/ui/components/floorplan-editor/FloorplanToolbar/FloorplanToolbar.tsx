import { FloorAction, FloorplanEditorState } from '../FloorplanEditor/FloorplanEditor';
import './FloorplanToolbar.scss';

interface FloorplanToolbarProps {
  state: FloorplanEditorState;
  onStateChange: (state: FloorplanEditorState) => void;
}

export function FloorplanToolbar({ state, onStateChange }: FloorplanToolbarProps) {
  const setAction = (action: FloorAction) => {
    onStateChange({ ...state, currentAction: action });
  };

  const setHeight = (height: number) => {
    onStateChange({ ...state, currentHeight: Math.max(0, Math.min(26, height)) });
  };

  const setDoorDirection = () => {
    onStateChange({ ...state, doorDirection: (state.doorDirection + 1) % 8 });
  };

  const setWallHeight = (height: number) => {
    onStateChange({ ...state, wallHeight: Math.max(0, Math.min(16, height)) });
  };

  return (
    <div className="floorplan-toolbar">
      {/* Drawing Tools */}
      <div className="toolbar-section">
        <h3>Drawing Mode</h3>
        <div className="tool-buttons">
          <button
            className={`tool-btn ${state.currentAction === FloorAction.SET ? 'active' : ''}`}
            onClick={() => setAction(FloorAction.SET)}
            title="Set tile height"
          >
            <img src="/assets/images/floorplan-editor/icon-tile-set.png" alt="Set" />
          </button>
          <button
            className={`tool-btn ${state.currentAction === FloorAction.UNSET ? 'active' : ''}`}
            onClick={() => setAction(FloorAction.UNSET)}
            title="Remove tile"
          >
            <img src="/assets/images/floorplan-editor/icon-tile-unset.png" alt="Unset" />
          </button>
          <button
            className={`tool-btn ${state.currentAction === FloorAction.UP ? 'active' : ''}`}
            onClick={() => setAction(FloorAction.UP)}
            title="Increase height"
          >
            <img src="/assets/images/floorplan-editor/icon-tile-up.png" alt="Up" />
          </button>
          <button
            className={`tool-btn ${state.currentAction === FloorAction.DOWN ? 'active' : ''}`}
            onClick={() => setAction(FloorAction.DOWN)}
            title="Decrease height"
          >
            <img src="/assets/images/floorplan-editor/icon-tile-down.png" alt="Down" />
          </button>
          <button
            className={`tool-btn ${state.currentAction === FloorAction.DOOR ? 'active' : ''}`}
            onClick={() => setAction(FloorAction.DOOR)}
            title="Place door"
          >
            <img src="/assets/images/floorplan-editor/icon-door.png" alt="Door" />
          </button>
        </div>
      </div>

      {/* Door Direction */}
      <div className="toolbar-section">
        <h3>Door Direction</h3>
        <button className="door-direction-btn" onClick={setDoorDirection}>
          <img
            src={`/assets/images/floorplan-editor/door-direction-${state.doorDirection}.png`}
            alt={`Direction ${state.doorDirection}`}
          />
        </button>
      </div>

      {/* Wall Height */}
      <div className="toolbar-section">
        <h3>Wall Height</h3>
        <div className="number-input">
          <button onClick={() => setWallHeight(state.wallHeight - 1)}>-</button>
          <span>{state.wallHeight}</span>
          <button onClick={() => setWallHeight(state.wallHeight + 1)}>+</button>
        </div>
      </div>

      {/* Tile Height Slider */}
      <div className="toolbar-section full-width">
        <h3>Tile Height: {state.currentHeight}</h3>
        <input
          type="range"
          min="0"
          max="26"
          value={state.currentHeight}
          onChange={(e) => setHeight(parseInt(e.target.value))}
          className="height-slider"
        />
      </div>
    </div>
  );
}
