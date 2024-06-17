const monitorDependencies = () => {
  const dependencies = [
    { name: 'express', version: '4.19.2', latest: '4.19.2' },
    { name: 'mongoose', version: '7.6.13', latest: '7.6.14' },
    { name: 'dotenv', version: '16.4.5', latest: '16.4.5' }
  ];

  const outdated = dependencies.filter(dep => dep.version !== dep.latest);

  return {
    dependencies,
    outdated,
  };
};

const resolveConflicts = () => {
  const conflicts = [
    { name: 'express', versions: ['4.19.2', '4.17.1'] },
    { name: 'lodash', versions: ['4.17.21', '4.17.20'] }
  ];

  const resolved = conflicts.map(conflict => ({
    name: conflict.name,
    resolvedVersion: conflict.versions[0] // Assume the first version is the resolved one
  }));

  return {
    resolved,
    conflicts,
  };
};

module.exports = { monitorDependencies, resolveConflicts };
