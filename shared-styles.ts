/**
 * @fileoverview Shared CSS styles for the Whisper Music OS application.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {css} from 'lit';

export const sharedStyles = css`
  /* General Components */
  button, .button {
    font-family: var(--font-sans);
    font-size: 0.9rem;
    font-weight: 600;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    white-space: nowrap;
    
    background-color: var(--bg-input);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }
  button:hover:not(:disabled), .button:hover:not(:disabled) {
    background-color: var(--bg-hover);
    border-color: var(--border-color-strong);
    color: var(--text-primary);
    transform: translateY(-1px);
  }
  button:disabled, .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  button.primary, .button.primary {
    background: var(--accent-primary-gradient);
    color: var(--text-on-accent);
    border: none;
    font-weight: 700;
    box-shadow: 0 2px 8px var(--shadow-color);
  }
  button.primary:hover:not(:disabled), .button.primary:hover:not(:disabled) {
    color: var(--text-on-accent);
    box-shadow: 0 4px 15px var(--glow-color);
    transform: translateY(-2px);
  }

  button.ghost, .button.ghost {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }
  button.ghost:hover:not(:disabled) {
    border-color: var(--accent-primary);
    background-color: var(--glow-color);
    color: var(--accent-primary);
  }
  
  .icon-button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: var(--spacing-sm);
    border-radius: 50%;
    width: 44px;
    height: 44px;
  }
  .icon-button:hover:not(:disabled) {
    background-color: var(--bg-hover);
    color: var(--accent-primary);
  }
  .icon-button.active {
    color: var(--accent-primary);
    background-color: var(--glow-color);
  }

  input, textarea, select {
    font-family: var(--font-sans);
    font-size: 0.9rem;
    background-color: var(--bg-input);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm) var(--spacing-md);
    transition: var(--transition-fast);
    width: 100%;
  }
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--glow-color);
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: var(--bg-input);
    border-radius: 3px;
    padding: 0;
    border: 1px solid var(--border-color);
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--accent-primary);
    border-radius: 50%;
    cursor: pointer;
    transition: var(--transition-fast);
    box-shadow: 0 0 8px var(--glow-color);
    border: 2px solid var(--bg-panel-solid);
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  
  /* Layout & Panels */
  .panel {
    padding: var(--spacing-xl);
    height: 100%;
    overflow-y: auto;
  }
  .control-group {
    margin-bottom: var(--spacing-xl);
  }
  .page-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-lg) 0;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    align-items: flex-start;
  }
  
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  .sub-label {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-top: var(--spacing-xs);
  }
  
  .well {
    background-color: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
  }
  
  details {
    background-color: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    transition: var(--transition-fast);
  }
  details[open] {
    border-color: var(--border-color-strong);
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    padding: var(--spacing-md);
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '▸';
    transition: transform 0.2s;
  }
  details[open] summary::after {
    transform: rotate(90deg);
  }
  details .group {
    padding: 0 var(--spacing-md) var(--spacing-md);
    border-top: 1px solid var(--border-color);
  }


  /* Error Message */
  .error-message {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
    border: 1px solid var(--color-error);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    margin-top: var(--spacing-md);
    font-size: 0.85rem;
  }

  /* Spinner */
  .spinner {
      animation: rotate 1.5s linear infinite;
  }
  @keyframes rotate {
      100% { transform: rotate(360deg); }
  }
  .spinner .path {
      stroke: currentColor;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
  }
  @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(10, 10, 26, 0.8);
    backdrop-filter: var(--backdrop-blur);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  .modal-content {
    background-color: var(--bg-panel-solid);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: var(--spacing-lg);
    width: 100%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
  .modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
  }
  .close-button {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
  }
  .close-button:hover {
    color: var(--text-primary);
  }
  
  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
  }
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-input);
    border: 1px solid var(--border-color);
    transition: .4s;
    border-radius: 22px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: var(--text-secondary);
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: var(--accent-primary);
    border-color: var(--accent-primary);
  }
  input:checked + .slider:before {
    transform: translateX(18px);
    background-color: white;
  }
`;