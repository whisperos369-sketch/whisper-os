export interface ABCompareState {
  result: number;
}

export class ABCompareService {
  state: ABCompareState = { result: 0 };

  async compare(_a: AudioBuffer, _b: AudioBuffer): Promise<ABCompareState> {
    return this.state;
  }

  on(_event: string, _handler: (...args: any[]) => void) {
    /* no-op */
  }
}
