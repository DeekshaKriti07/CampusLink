import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main style={{padding:32}}><h1>Could not load this page.</h1><p>Reload to get the latest version of CampusLink.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></main>;
    return this.props.children;
  }
}
