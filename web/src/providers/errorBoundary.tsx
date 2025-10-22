import { fetchNui } from '@/utils/fetchNui';
import { Component, ReactNode, ErrorInfo } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_err: Error) {
        return { hasError: true };
    }

    componentDidCatch(_error: Error, _info: ErrorInfo) {
        this.setState({ hasError: false });

        fetchNui('hideFrame')
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
}

export default ErrorBoundary;