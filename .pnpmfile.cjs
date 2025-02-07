module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies.jest) {
        pkg.dependencies.jest = '29.7.0';
      }
      if (pkg.devDependencies && pkg.devDependencies.jest) {
        pkg.devDependencies.jest = '29.7.0';
      }
      return pkg;
    },
  },
};
