class Bleu {
    manageDependencies(dependencies) {
      dependencies.forEach(dependency => {
        console.log(`Managing dependency: ${dependency.name}@${dependency.version}`);
      });
    }
  }
  
  module.exports = Bleu;
  