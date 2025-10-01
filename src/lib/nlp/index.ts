/**
 * NLP Module - Pattern Recognition and Text Analysis
 * 
 * Central export point for all NLP functionality
 */

export { PatternLibrary } from './patternDefinitions';
export { PatternMatcher } from './patternMatcher';
export { TextAnalyzer } from './textAnalyzer';
export { ContentClassifier } from './contentClassifier';
export { EntityRecognizer } from './entityRecognizer';
export { TextAnalysisEngine } from './textAnalysisEngine';

// Re-export commonly used functions
export const analyzeText = (text: string, targetFormat?: import('@/types').FormatType) => {
  const { TextAnalysisEngine } = require('./textAnalysisEngine');
  return TextAnalysisEngine.analyzeText(text, targetFormat);
};

export const detectFormat = (text: string) => {
  const { TextAnalysisEngine } = require('./textAnalysisEngine');
  return TextAnalysisEngine.detectFormat(text);
};

export const getTextStatistics = (text: string) => {
  const { TextAnalyzer } = require('./textAnalyzer');
  return TextAnalyzer.getTextStatistics(text);
};
