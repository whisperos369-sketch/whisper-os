export type EventHandler = (...args: any[]) => void;

export const bus = {
  on(_event: string, _handler: EventHandler) {
    /* no-op */
  },
};
