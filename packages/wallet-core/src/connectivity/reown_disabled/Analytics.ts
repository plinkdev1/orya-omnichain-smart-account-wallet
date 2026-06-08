export interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  sessionId?: string;
  chainId?: string;
  method?: string;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
  error?: string;
}

export interface AnalyticsMetrics {
  totalSessions: number;
  activeSessions: number;
  approvedSessions: number;
  rejectedSessions: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  chainDistribution: Record<string, number>;
  methodDistribution: Record<string, number>;
}

export type AnalyticsEventType =
  | 'session_created'
  | 'session_approved'
  | 'session_rejected'
  | 'session_expired'
  | 'signing_request_created'
  | 'signing_request_approved'
  | 'signing_request_rejected'
  | 'signing_request_timeout'
  | 'error_occurred'
  | 'custom';

export class Analytics {
  private events: AnalyticsEvent[] = [];
  private eventHandlers: Map<string, ((event: AnalyticsEvent) => void)[]> = new Map();
  private maxEvents: number = 1000;
  private flushInterval: number = 60000; // 1 minute
  private flushTimer?: ReturnType<typeof setInterval>;
  private static instance: Analytics;

  private constructor() {
    this.startAutoFlush();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  static initialize(): Analytics {
    Analytics.instance = new Analytics();
    return Analytics.instance;
  }

  trackEvent(
    eventType: AnalyticsEventType | string,
    status: 'success' | 'error' | 'pending' = 'success',
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      status,
      metadata,
    };

    this.addEvent(event);
    this.executeHandlers(eventType, event);
  }

  trackSessionEvent(
    eventType: AnalyticsEventType,
    sessionId: string,
    chainId: string,
    status: 'success' | 'error' = 'success',
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      sessionId,
      chainId,
      status,
      metadata,
    };

    this.addEvent(event);
    this.executeHandlers(eventType, event);
  }

  trackSigningRequest(
    eventType: AnalyticsEventType,
    sessionId: string,
    chainId: string,
    method: string,
    status: 'success' | 'error' | 'pending' = 'pending',
    metadata?: Record<string, any>,
    error?: string
  ): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      sessionId,
      chainId,
      method,
      status,
      metadata,
      error,
    };

    this.addEvent(event);
    this.executeHandlers(eventType, event);
  }

  on(eventType: string, handler: (event: AnalyticsEvent) => void): () => void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);

    return () => {
      const idx = handlers.indexOf(handler);
      if (idx > -1) {
        handlers.splice(idx, 1);
      }
    };
  }

  off(eventType: string, handler: (event: AnalyticsEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const idx = handlers.indexOf(handler);
    if (idx > -1) {
      handlers.splice(idx, 1);
    }
  }

  getEvents(
    filter?: {
      eventType?: string;
      sessionId?: string;
      chainId?: string;
      status?: 'success' | 'error' | 'pending';
      timeRange?: { start: number; end: number };
    }
  ): AnalyticsEvent[] {
    let filtered = [...this.events];

    if (filter) {
      if (filter.eventType) {
        filtered = filtered.filter(e => e.eventType === filter.eventType);
      }
      if (filter.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.chainId) {
        filtered = filtered.filter(e => e.chainId === filter.chainId);
      }
      if (filter.status) {
        filtered = filtered.filter(e => e.status === filter.status);
      }
      if (filter.timeRange) {
        filtered = filtered.filter(
          e => e.timestamp >= filter.timeRange!.start && e.timestamp <= filter.timeRange!.end
        );
      }
    }

    return filtered;
  }

  getMetrics(): AnalyticsMetrics {
    const sessions = this.getEvents({ eventType: 'session_created' });
    const approved = this.getEvents({ eventType: 'session_approved' });
    const rejected = this.getEvents({ eventType: 'session_rejected' });
    const requests = this.getEvents({ eventType: 'signing_request_created' });
    const successfulRequests = this.getEvents({ eventType: 'signing_request_approved' });
    const failedRequests = this.getEvents({ eventType: 'signing_request_rejected' });

    const chainDist: Record<string, number> = {};
    const methodDist: Record<string, number> = {};

    this.events.forEach(e => {
      if (e.chainId) {
        chainDist[e.chainId] = (chainDist[e.chainId] || 0) + 1;
      }
      if (e.method) {
        methodDist[e.method] = (methodDist[e.method] || 0) + 1;
      }
    });

    const avgResponseTime =
      successfulRequests.length > 0
        ? successfulRequests.reduce((sum, req) => {
            const created = this.events.find(
              e => e.eventType === 'signing_request_created' && e.metadata?.requestId === req.metadata?.requestId
            );
            return sum + (created ? req.timestamp - created.timestamp : 0);
          }, 0) / successfulRequests.length
        : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: approved.length,
      approvedSessions: approved.length,
      rejectedSessions: rejected.length,
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: avgResponseTime,
      chainDistribution: chainDist,
      methodDistribution: methodDist,
    };
  }

  clear(): void {
    this.events = [];
    this.eventHandlers.clear();
  }

  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private executeHandlers(eventType: string, event: AnalyticsEvent): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error executing handler for ${eventType}:`, error);
      }
    });

    const wildcard = this.eventHandlers.get('*') || [];
    wildcard.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error executing wildcard handler:', error);
      }
    });
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  flush(): void {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      const payload = {
        timestamp: Date.now(),
        events: eventsToFlush,
        metrics: this.getMetrics(),
      };

      this.executeHandlers('flush', {
        eventType: 'flush',
        timestamp: Date.now(),
        status: 'success',
        metadata: { eventCount: eventsToFlush.length },
      });
    } catch (error) {
      console.error('Error flushing analytics:', error);
    }
  }

  destroy(): void {
    this.stopAutoFlush();
    this.flush();
    this.clear();
  }
}
