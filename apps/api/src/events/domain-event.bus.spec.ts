import { describe, expect, it, vi } from 'vitest';
import { DomainEventBus } from './domain-event.bus';
import { DomainEventType } from './domain-event';

describe('DomainEventBus', () => {
  it('publishes events to subscribed handlers', async () => {
    const bus = new DomainEventBus();
    const handler = vi.fn();
    bus.subscribe(DomainEventType.LeaveApproved, handler);
    const event = { type: DomainEventType.LeaveApproved, organizationId: 'org-1', resourceType: 'LEAVE_REQUEST', resourceId: 'leave-1', occurredAt: new Date(), payload: { workingDays: 1 } };
    await bus.publish(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not invoke handlers for other event types', async () => {
    const bus = new DomainEventBus();
    const handler = vi.fn();
    bus.subscribe(DomainEventType.LeaveApproved, handler);
    await bus.publish({ type: DomainEventType.LeaveRejected, organizationId: 'org-1', resourceType: 'LEAVE_REQUEST', resourceId: 'leave-1', occurredAt: new Date(), payload: {} });
    expect(handler).not.toHaveBeenCalled();
  });
});
