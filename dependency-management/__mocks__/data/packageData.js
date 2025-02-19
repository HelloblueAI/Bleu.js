const mockPackageJson = {
  name: 'test-project',
  version: '1.0.0',
  dependencies: {
    express: '^4.19.2',
    mongoose: '^7.6.13',
    dotenv: '^16.4.5',
  },
  devDependencies: {
    jest: '^29.7.0',
    typescript: '^5.0.4',
  },
};

const mockVersions = {
  express: '4.19.2',
  mongoose: '7.6.14',
  dotenv: '16.4.5',
  jest: '29.7.0',
  typescript: '5.0.4',
};

const mockConflicts = [
  {
    name: 'express',
    versions: ['4.19.2', '4.18.0'],
    dependents: ['app', 'api'],
  },
  {
    name: 'mongoose',
    versions: ['7.6.13', '7.6.14'],
    dependents: ['models', 'database'],
  },
];

module.exports = {
  mockPackageJson,
  mockVersions,
  mockConflicts,
};
