declare module '@/config/env.ts' {
  export const flags: any;
  export const env: any;
  export default env;
}

declare module '@/ui/services/_fetch.ts' {
  export function _fetch(...args: any[]): Promise<any>;
  export default _fetch;
}

declare module '@/ui/ab-compare-service.ts' {
  export type ABCompareState = any;
  export class ABCompareService {
    state: ABCompareState;
    on(...args: any[]): void;
  }
}

declare module '@/core/orchestrator.ts' {
  export class Orchestrator {
    constructor(...args: any[]);
    runPipeline(...args: any[]): Promise<any>;
  }
  export default Orchestrator;
}

declare module '@/core/model-manager.ts' {
  export function bootstrapDefaultModels(...args: any[]): any;
  export function getModel(...args: any[]): any;
}

declare module '@/agents/register.ts' {
  export function registerAllAgents(...args: any[]): any;
}

declare module '@/media/media-engine.ts' {
  export const mediaEngine: any;
}

declare module '@/core/bus.ts' {
  export const bus: any;
  export type OrchestratorEvent = any;
  export default bus;
}

declare module '@/core/types.ts' {
  export type OrchestratorEvent = any;
}

declare module '@/toast-portal.ts' {
  export type ToastPortal = any;
  const value: any;
  export default value;
}

declare module '@/RenderRecovery.tsx' {
  export type RenderRecoveryPanel = any;
  const value: any;
  export default value;
}

declare module '@/command-palette.ts' {
  export type CommandPalette = any;
  const value: any;
  export default value;
}

declare module '@/ui/ops/index.ts' {
  export type Settings = any;
  export function getSettings(...args: any[]): Promise<Settings>;
  export function updateSettings(...args: any[]): Promise<any>;
}

declare module '@/ui/ops/types.ts' {
  export type Settings = any;
}

declare module '@/ui/context.ts' {
  export type AppContext = any;
  export const appContext: any;
  export default appContext;
}

declare module '@/ui/sections.ts' {
  export type Clip = any;
  export type Track = any;
}
