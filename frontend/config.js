// Frontend configuration
(function() {
    // Default configuration
    const defaultConfig = {
        API_BASE: 'http://localhost:5002',
        API_URL: 'http://localhost:5002/api'
    };

    // Create global API_CONFIG if it doesn't exist
    window.API_CONFIG = window.API_CONFIG || {};
    
    // Merge with existing config or use defaults
    window.API_CONFIG = {
        ...defaultConfig,
        ...window.API_CONFIG
    };

    // Set the API_BASE as a global variable for backward compatibility
    window.API_BASE = window.API_CONFIG.API_BASE;
    
    // Log the configuration for debugging
    console.log('API Configuration loaded:', window.API_CONFIG);
})();