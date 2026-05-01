export interface ApiSuccessEnvelope<T> {
  data: T;
}

export interface ApiErrorEnvelope {
  error: {
    message: string;
    code: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}
