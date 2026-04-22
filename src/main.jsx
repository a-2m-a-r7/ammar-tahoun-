import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "./styles.css";
import App from "./App";
import AdminApp from "./AdminApp";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected admin runtime error."
    };
  }

  componentDidCatch(error) {
    console.error("Admin route crashed:", error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-white md:px-6">
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <div className="gradient-veil" />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="blob blob-one" />
          <div className="blob blob-two" />
          <div className="blob blob-three" />
        </div>

        <div className="relative z-[1] mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
          <div className="glow-border glass-panel w-full rounded-[2rem] p-6 md:p-8">
            <p className="display-meta text-cyan-200/76">Admin Recovery</p>
            <h1 className="section-title mt-3 text-white">The admin page hit a runtime issue.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
              A safe fallback was shown instead of a blank page so you can refresh and continue working.
            </p>

            <div className="mt-6 rounded-[1.4rem] border border-amber-300/18 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              {this.state.message}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/16"
              >
                Refresh Admin
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white/82 transition hover:bg-white/10"
              >
                Open Portfolio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class PortfolioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected portfolio runtime error."
    };
  }

  componentDidCatch(error) {
    console.error("Portfolio route crashed:", error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-10 text-white md:px-6">
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <div className="gradient-veil" />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="blob blob-one" />
          <div className="blob blob-two" />
          <div className="blob blob-three" />
        </div>

        <div className="relative z-[1] mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
          <div className="glow-border glass-panel w-full rounded-[2rem] p-6 md:p-8">
            <p className="display-meta text-cyan-200/76">Portfolio Recovery</p>
            <h1 className="section-title mt-3 text-white">The portfolio hit a runtime issue.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
              A safe fallback was shown instead of a blank page so the deployment stays debuggable.
            </p>

            <div className="mt-6 rounded-[1.4rem] border border-amber-300/18 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              {this.state.message}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/16"
              >
                Refresh Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const RootComponent = isAdminRoute ? AdminApp : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <AdminErrorBoundary>
        <RootComponent />
      </AdminErrorBoundary>
    ) : (
      <PortfolioErrorBoundary>
        <RootComponent />
      </PortfolioErrorBoundary>
    )}
  </React.StrictMode>
);
