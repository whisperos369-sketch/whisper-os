export interface ABCompareState {}
export class ABCompareService {
    state: ABCompareState = {};
    on(_event: string, _handler: (state: ABCompareState) => void) {
        /* no-op */
    }
}
