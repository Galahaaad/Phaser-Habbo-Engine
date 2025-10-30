import { useState } from 'react';
import './App.scss';
import { Toolbar } from '../components/toolbar';
import { FloorplanEditor } from '../components/floorplan-editor';

export function App() {
  const [showFloorplanEditor, setShowFloorplanEditor] = useState(true);

  return (
    <div className="ui-container">
      <Toolbar />
      {showFloorplanEditor && (
        <FloorplanEditor onClose={() => setShowFloorplanEditor(false)} />
      )}
    </div>
  );
}
