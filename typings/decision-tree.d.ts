declare namespace DecisionTree {
  interface TrainingData {
    [key: string]: any;
  }

  type Feature = string;

  class DecisionTree {
    constructor(
      trainingData: TrainingData[],
      className: string,
      features: Feature[],
    );
    predict(input: TrainingData): string;
    evaluate(testData: TrainingData[]): number;
  }
}

export = DecisionTree;
