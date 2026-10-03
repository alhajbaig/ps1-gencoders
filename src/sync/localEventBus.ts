import type { SyncEventType } from './syncEvents';

type EventHandler<T = unknown> = (payload: T) => void;

class LocalEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on<T = unknown>(event: SyncEventType | string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as EventHandler);

    // Return unbind function
    return () => {
      set.delete(handler as EventHandler);
    };
  }

  emit<T = unknown>(event: SyncEventType | string, payload?: T): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[EVENT_BUS] Error executing handler for event ${event}:`, e);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const localEventBus = new LocalEventBus();
