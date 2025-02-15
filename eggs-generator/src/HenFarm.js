class HenFarm {
  generateCode(type, options) {
    switch (type) {
      case 'model': {
        const fields = options.fields
          .map((field) => field.name + ': ' + field.type + ';')
          .join('\n  ');
        return 'class ' + options.modelName + ' {\n  ' + fields + '\n}';
      }
      case 'utility': {
        const methods = options.methods
          .map((method) => {
            return method + '() {\n    // TODO: Implement ' + method + '\n  }';
          })
          .join('\n  ');
        return 'class ' + options.utilityName + ' {\n  ' + methods + '\n}';
      }
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }
}

export default HenFarm;
