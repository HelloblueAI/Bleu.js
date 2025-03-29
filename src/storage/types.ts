export interface StorageConfig {
  /**
   * The path where files will be stored
   */
  path: string;

  /**
   * Number of days to retain files before cleanup
   */
  retentionDays: number;

  /**
   * Whether to compress stored files
   */
  compression: boolean;
} 