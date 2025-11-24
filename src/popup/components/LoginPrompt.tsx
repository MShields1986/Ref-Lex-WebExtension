import React from 'react';

interface LoginPromptProps {
  onLogin: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin }) => {
  return (
    <div className="login-prompt">
      <h2>Welcome to Ref-Lex!</h2>
      <p>
        Please log in to your Ref-Lex account to start adding references to
        your projects.
      </p>
      <button className="btn btn-primary" onClick={onLogin}>
        Login to Ref-Lex
      </button>
    </div>
  );
};

export default LoginPrompt;
