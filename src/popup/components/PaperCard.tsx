import React from 'react';
import { PaperMetadata } from '../../shared/types';

interface PaperCardProps {
  paper: PaperMetadata;
}

const PaperCard: React.FC<PaperCardProps> = ({ paper }) => {
  return (
    <div className="paper-card">
      <div className="paper-card-header">
        <h3 className="paper-title">{paper.title || 'Untitled'}</h3>

        {paper.authors && paper.authors.length > 0 && (
          <div className="paper-meta">
            <strong>Authors:</strong> {paper.authors.join(', ')}
          </div>
        )}

        {paper.year && (
          <div className="paper-meta">
            <strong>Year:</strong> {paper.year}
          </div>
        )}

        {paper.journal && (
          <div className="paper-meta">
            <strong>Journal:</strong> {paper.journal}
          </div>
        )}

        {paper.doi && (
          <div className="paper-meta">
            <strong>DOI:</strong> {paper.doi}
          </div>
        )}

        <span className="paper-source">
          Detected from: {paper.source}
        </span>
      </div>
    </div>
  );
};

export default PaperCard;
