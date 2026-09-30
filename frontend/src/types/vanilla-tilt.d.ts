declare module "vanilla-tilt" {
  export interface VanillaTiltOptions {
    max?: number;
    perspective?: number;
    easing?: string;
    scale?: number;
    speed?: number;
    transition?: boolean;
    axis?: "x" | "y" | null;
    reset?: boolean;
    glare?: boolean;
    "max-glare"?: number;
    "glare-prerender"?: boolean;
    "mouse-event-element"?: string | null;
    gyroscope?: boolean;
    gyroscopeMinAngleX?: number;
    gyroscopeMaxAngleX?: number;
    gyroscopeMinAngleY?: number;
    gyroscopeMaxAngleY?: number;
    gyroscopeSamples?: number;
  }

  export interface VanillaTiltInstance {
    destroy: () => void;
    getValues: () => { tiltX: number; tiltY: number; percentageX: number; percentageY: number };
    reset: () => void;
  }

  export default class VanillaTilt {
    static init(elements: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>, options?: VanillaTiltOptions): void;
    destroy(): void;
  }
}
