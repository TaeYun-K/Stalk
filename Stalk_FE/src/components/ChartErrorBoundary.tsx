import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-2">차트를 불러올 수 없습니다</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;