import React from 'react';
import { Project } from '../../shared/types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: number | null;
  onChange: (projectId: number) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onChange,
}) => {
  if (projects.length === 0) {
    return (
      <div className="form-group">
        <label className="form-label">Project</label>
        <div className="message message-warning">
          No projects found. Create a project in Ref-Lex first.
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="project-select">
        Project *
      </label>
      <select
        id="project-select"
        className="form-select"
        value={selectedProjectId || ''}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="" disabled>
          Select a project...
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
            {project.is_owner === false && ' (Shared)'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectSelector;
