/**
 * Disaster Response and Volunteer Coordination Platform
 * Unified Production API Configuration & Routing Bridge
 *
 * Automatically handles:
 * 1. Local execution (relative /api calls to the Express server)
 * 2. Netlify static hosting with Netlify rewrite proxy (_redirects / netlify.toml)
 * 3. Netlify static hosting with direct Render backend URL
 * 4. Single-service full-stack deployment on Render
 */

(function () {
    // 1. Check for runtime backend URL parameter, e.g.:
    // https://your-site.netlify.app/?backend=https://your-backend.onrender.com
    try {
        if (typeof window !== "undefined" && window.location && window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("backend")) {
                const paramBackend = urlParams.get("backend").trim();
                if (paramBackend) {
                    localStorage.setItem("BACKEND_URL", paramBackend);
                }
            }
        }
    } catch (e) {
        // Safe fallback
    }

    // 2. Resolve configured backend URL
    const storedBackend = (typeof localStorage !== "undefined" && localStorage.getItem("BACKEND_URL")) || "";

    // OPTIONAL: Hardcode your deployed Render backend URL here if not using Netlify proxy:
    // e.g. window.DEFAULT_BACKEND_URL = "https://disaster-response-backend.onrender.com";
    const defaultBackend = window.DEFAULT_BACKEND_URL || "";

    window.BACKEND_URL = (window.BACKEND_URL || storedBackend || defaultBackend).trim();

    // 3. Helper to build full endpoint URL
    window.getApiUrl = function (path) {
        if (!path) return path;
        if (!path.startsWith("/")) path = "/" + path;
        
        // If BACKEND_URL is set and not running on localhost/127.0.0.1, prefix with BACKEND_URL
        if (window.BACKEND_URL && window.location && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
            return window.BACKEND_URL.replace(/\/+$/, "") + path;
        }
        return path;
    };

    // 4. Intercept window.fetch so all existing /api calls automatically route to the active backend
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
        const originalFetch = window.fetch;
        window.fetch = function (resource, init) {
            try {
                if (typeof resource === "string") {
                    if (resource.startsWith("/api/")) {
                        resource = window.getApiUrl(resource);
                    }
                } else if (resource && typeof resource === "object" && resource.url) {
                    const url = new URL(resource.url, window.location.origin);
                    if (url.pathname.startsWith("/api/")) {
                        const targetUrl = window.getApiUrl(url.pathname + url.search);
                        resource = new Request(targetUrl, resource);
                    }
                }
            } catch (err) {
                console.warn("Disaster API bridge router warning:", err);
            }
            return originalFetch.call(this, resource, init);
        };
    }

    if (window.BACKEND_URL) {
        console.log("Disaster Response API connected to backend:", window.BACKEND_URL);
    } else {
        console.log("Disaster Response API using relative proxy (/api)");
    }
})();
