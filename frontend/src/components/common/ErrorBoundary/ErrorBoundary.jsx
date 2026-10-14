/**
 * @file ErrorBoundary.jsx
 * @description Application React Error Boundary Component.
 * Class component that catches unhandled JavaScript errors anywhere in its child component tree,
 * logs error details, and presents a responsive fallback UI with reload capability and developer debugging info.
 *
 * @module components/common/ErrorBoundary
 */

import { Component } from 'react';
import Card from '../Card/Card';
import Button from '../Button/Button';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="error-boundary-container">
          <Card title="Something Went Wrong" className="error-boundary-card">
            <div className="error-boundary-content">
              <p className="error-boundary-message">
                An unexpected error occurred while rendering this page. Please try reloading the page to continue.
              </p>

              {isDev && this.state.error && (
                <div className="error-boundary-dev-box">
                  <span className="error-boundary-dev-title">Debug Information (Development Only):</span>
                  <pre className="error-boundary-dev-details">
                    {this.state.error.toString()}
                    {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                  </pre>
                </div>
              )}

              <div className="error-boundary-actions">
                <Button variant="primary" onClick={this.handleReload}>
                  Reload page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
