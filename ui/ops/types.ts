export interface Operation {
  id: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface Settings {
  theme?: string;
  numerology?: {
    enabled?: boolean;
  };
}
