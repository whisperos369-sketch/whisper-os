export class ModelManager {
  load() {
    return Promise.resolve();
  }

  runPipeline() {
    return Promise.resolve();
  }
}

export async function bootstrapDefaultModels() {
  return Promise.resolve();
}

export function getModel(_id: string) {
  return null;
}

export const modelManager = new ModelManager();
