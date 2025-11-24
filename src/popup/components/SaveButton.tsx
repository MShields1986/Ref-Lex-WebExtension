import React from 'react';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      className="btn btn-primary btn-full"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span style={{ marginRight: '8px' }}>Adding...</span>
          <div
            className="spinner"
            style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block' }}
          ></div>
        </>
      ) : (
        'Add to Ref-Lex'
      )}
    </button>
  );
};

export default SaveButton;
