import { v4 as uuidv4 } from 'uuid';

export function generateEgg(options, plugins = []) {
  if (!options || typeof options !== 'object') {
    throw new Error('Options are required and must be an object');
  }

  const { type, description, metadata = {} } = options;

  if (!type || typeof type !== 'string') {
    throw new Error('A valid "type" is required and must be a string');
  }

  if (!description || typeof description !== 'string') {
    throw new Error('A valid "description" is required and must be a string');
  }

  const egg = {
    id: uuidv4(),
    type,
    description,
    metadata: { ...metadata },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  plugins.forEach((plugin) => {
    if (typeof plugin === 'function') {
      plugin(egg);
    }
  });

  console.debug('Generated Egg:', egg);

  return egg;
}

export function addTagsPlugin(egg) {
  if (!egg.metadata.tags) {
    egg.metadata.tags = ['default-tag'];
  }
}

export function addVersionPlugin(egg) {
  egg.metadata.version = '1.0.30';
}
