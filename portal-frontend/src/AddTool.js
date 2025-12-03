import React, { useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { protectedApiRequest } from './authConfig';
import { useNavigate } from 'react-router-dom';
import './App.css';

const AddTool = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_path: ''
  });
  
  const [urlValidation, setUrlValidation] = useState({
    checked: false,
    isValid: false,
    checking: false,
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset URL validation when URL changes
    if (name === 'target_path') {
      setUrlValidation({
        checked: false,
        isValid: false,
        checking: false,
        message: ''
      });
    }
  };

  const validateUrl = async () => {
    if (!formData.target_path.trim()) {
      setUrlValidation({
        checked: true,
        isValid: false,
        checking: false,
        message: 'Please enter a URL'
      });
      return;
    }

    setUrlValidation(prev => ({ ...prev, checking: true }));
    
    try {
      // First check if it's a valid URL format
      new URL(formData.target_path);
      
      // Make a real HTTP request to check if the URL is live
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(formData.target_path, {
        method: 'HEAD', // Use HEAD to avoid downloading content
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setUrlValidation({
          checked: true,
          isValid: true,
          checking: false,
          message: `URL is live and accessible (Status: ${response.status})`
        });
      } else {
        setUrlValidation({
          checked: true,
          isValid: false,
          checking: false,
          message: `URL returned error status: ${response.status} ${response.statusText}`
        });
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setUrlValidation({
          checked: true,
          isValid: false,
          checking: false,
          message: 'URL validation timed out (10 seconds)'
        });
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setUrlValidation({
          checked: true,
          isValid: false,
          checking: false,
          message: 'URL is not accessible - network error or CORS blocked'
        });
      } else if (error.message.includes('Invalid URL')) {
        setUrlValidation({
          checked: true,
          isValid: false,
          checking: false,
          message: 'Invalid URL format'
        });
      } else {
        setUrlValidation({
          checked: true,
          isValid: false,
          checking: false,
          message: `URL validation failed: ${error.message}`
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!urlValidation.checked || !urlValidation.isValid) {
      setError('Please validate the URL before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const account = accounts[0];
      
      // Get the access token
      const response = await instance.acquireTokenSilent({
        ...protectedApiRequest,
        account: account
      });

      const token = response.accessToken;

      // Make the API call to create the tool
      const apiResponse = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || `API Error: ${apiResponse.status}`);
      }

      // Success - navigate back to the main page
      navigate('/');
      
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && 
                     formData.description.trim() && 
                     formData.target_path.trim() && 
                     urlValidation.checked && 
                     urlValidation.isValid;

  return (
    <div className="add-tool-container">
      <div className="add-tool-form">
        <h2>Add New Tool</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Tool Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter tool name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Enter tool description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="target_path">URL/Link:</label>
            <div className="url-input-group">
              <input
                type="url"
                id="target_path"
                name="target_path"
                value={formData.target_path}
                onChange={handleInputChange}
                required
                placeholder="https://example.com"
              />
              <button
                type="button"
                onClick={validateUrl}
                disabled={!formData.target_path.trim() || urlValidation.checking}
                className={`validate-btn ${urlValidation.checking ? 'checking' : ''}`}
              >
                {urlValidation.checking ? 'Checking...' : 'Check URL'}
              </button>
            </div>
            
            {urlValidation.checked && (
              <div className={`validation-message ${urlValidation.isValid ? 'valid' : 'invalid'}`}>
                {urlValidation.message}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Adding Tool...' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTool;
