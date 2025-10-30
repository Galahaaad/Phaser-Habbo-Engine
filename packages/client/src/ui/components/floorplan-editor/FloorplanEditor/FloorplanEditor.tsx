import { useState, useRef, useEffect } from 'react';
import './FloorplanEditor.scss';
import { FloorplanToolbar } from '../FloorplanToolbar/FloorplanToolbar';
import { FloorplanCanvas } from '../FloorplanCanvas/FloorplanCanvas';

export enum FloorAction {
  SET = 'SET',
  UNSET = 'UNSET',
  UP = 'UP',
  DOWN = 'DOWN',
  DOOR = 'DOOR'
}

export interface FloorplanEditorState {
  currentAction: FloorAction;
  currentHeight: number;
  doorDirection: number;
  wallHeight: number;
  wallThickness: number;
  floorThickness: number;
}

interface FloorplanEditorProps {
  onClose?: () => void;
}

export function FloorplanEditor({ onClose }: FloorplanEditorProps) {
  const [editorState, setEditorState] = useState<FloorplanEditorState>({
    currentAction: FloorAction.SET,
    currentHeight: 0,
    doorDirection: 2,
    wallHeight: 3,
    wallThickness: 1,
    floorThickness: 1
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !editorRef.current) return;

      const newLeft = e.clientX - dragOffset.x;
      const newTop = e.clientY - dragOffset.y;

      editorRef.current.style.left = `${newLeft}px`;
      editorRef.current.style.top = `${newTop}px`;
      editorRef.current.style.transform = 'none';
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!editorRef.current || (e.target as HTMLElement).classList.contains('close-btn')) return;

    const rect = editorRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleSave = () => {
    const pattern = (window as any).getFloorplanData?.();
    if (pattern) {
      console.log('Saving floorplan:', pattern);

      const game = (window as any).game;
      if (game) {
        game.events.emit('floorplan-updated', {
          pattern,
          wallHeight: editorState.wallHeight,
          wallThickness: editorState.wallThickness,
          floorThickness: editorState.floorThickness
        });
      }
    }
  };

  return (
    <div className="floorplan-editor" ref={editorRef} style={{ resize: 'both' }}>
      <div
        className="floorplan-editor-header"
        ref={headerRef}
        onMouseDown={handleHeaderMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <h2>Floorplan Editor</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="floorplan-editor-content">
        <FloorplanToolbar
          state={editorState}
          onStateChange={setEditorState}
        />

        <FloorplanCanvas
          state={editorState}
          onSaveRequest={handleSave}
        />
      </div>

      <div className="floorplan-editor-footer">
        <button className="btn btn-secondary">Import/Export</button>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
