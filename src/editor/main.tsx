import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from './EditorApp';
import './editor.css';

const root = createRoot(document.getElementById('root')!);
root.render(<EditorApp />);
