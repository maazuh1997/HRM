export type JobHandler = () => Promise<void>;

export type JobDefinition = {
  name: string;
  intervalMs: number;
  handler: JobHandler;
};
