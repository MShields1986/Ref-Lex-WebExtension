import React from 'react';

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor="notes-textarea">
        Notes (optional)
      </label>
      <textarea
        id="notes-textarea"
        className="form-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add your notes, comments, or annotations here..."
        rows={4}
      />
    </div>
  );
};

export default NotesEditor;
