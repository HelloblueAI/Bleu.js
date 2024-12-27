const path = require('path');

module.exports = (request, options) => {
  const { defaultResolver } = options;

  // Resolve custom aliases if they exist
  const customAliasMap = {
    '@core-engine': path.join(options.rootDir, 'core-engine/src'),
    '@eggs-generator': path.join(options.rootDir, 'eggs-generator/src'),
    '@backend': path.join(options.rootDir, 'backend'),
    '@language-plugins': path.join(options.rootDir, 'language-plugins'),
    '@': path.join(options.rootDir, 'src'), // Catch-all for @ alias
  };

  // Check if the request matches any custom aliases
  for (const [alias, targetPath] of Object.entries(customAliasMap)) {
    if (request.startsWith(alias)) {
      const relativePath = request.replace(alias, '');
      return path.resolve(targetPath, `.${relativePath}`);
    }
  }

  // For non-custom aliases, fallback to the default resolver
  try {
    return defaultResolver(request, options);
  } catch (err) {
    console.error(
      `Error resolving module "${request}". Falling back to default behavior.`,
      err.message,
    );
    throw err;
  }
};
