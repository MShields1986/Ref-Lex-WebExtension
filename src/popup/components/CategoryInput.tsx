import React, { useState, useEffect } from 'react';
import { browser } from '../../shared/browser';
import { Category, MessageResponse } from '../../shared/types';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  projectId: number | null;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  value,
  onChange,
  projectId,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadCategories(projectId);
    }
  }, [projectId]);

  async function loadCategories(pid: number) {
    setIsLoading(true);
    try {
      const response: MessageResponse = await browser.runtime.sendMessage({
        type: 'GET_CATEGORIES',
        payload: { projectId: pid },
      });

      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="category-input">
        Category (optional)
      </label>

      {categories.length > 0 ? (
        <select
          id="category-input"
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
          <option value="__custom__">+ New category...</option>
        </select>
      ) : (
        <input
          id="category-input"
          type="text"
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter category name..."
          disabled={isLoading}
        />
      )}

      {value === '__custom__' && (
        <input
          type="text"
          className="form-input mt-1"
          placeholder="Enter new category name..."
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}

      <p className="text-small text-muted mt-1">
        Category will be created if it doesn&apos;t exist
      </p>
    </div>
  );
};

export default CategoryInput;
