"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] px-5">
          <div className="text-center max-w-md">
            <span className="text-5xl block mb-4">⚠️</span>
            <h2 className="font-heading text-xl font-bold text-dark mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              페이지를 새로고침하거나, 문제가 계속되면 관리자에게 문의하세요.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
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
