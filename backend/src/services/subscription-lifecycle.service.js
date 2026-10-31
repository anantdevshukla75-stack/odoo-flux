import prisma from '../config/database.js';
import AppError from '../utils/appError.js';
import { addBillingInterval } from '../utils/date.utils.js';
import logger from '../utils/logger.js';

/**
 * Valid state transition graph
 */
const VALID_TRANSITIONS = {
  DRAFT: ['QUOTATION', 'CONFIRMED', 'CANCELLED'],
  QUOTATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'CLOSED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CLOSED', 'CANCELLED'],
  CLOSED: [], // Terminal state
  CANCELLED: [] // Terminal state
};

export class SubscriptionLifecycleService {
  /**
   * Validates if a transition from currentStatus to targetStatus is permitted
   * @param {string} currentStatus
   * @param {string} targetStatus
   * @returns {boolean}
   */
  static isValidTransition(currentStatus, targetStatus) {
    const allowedTargets = VALID_TRANSITIONS[currentStatus] || [];
    return allowedTargets.includes(targetStatus);
  }

  /**
   * Asserts valid transition, throwing operational AppError if illegal
   */
  static assertValidTransition(currentStatus, targetStatus) {
    if (!this.isValidTransition(currentStatus, targetStatus)) {
      throw AppError.badRequest(
        `Illegal subscription status transition from '${currentStatus}' to '${targetStatus}'.`,
        { currentStatus, targetStatus, allowedTransitions: VALID_TRANSITIONS[currentStatus] || [] },
        'INVALID_STATUS_TRANSITION'
      );
    }
  }

  /**
   * Records a transition event in SubscriptionHistory and SystemAuditLog
   */
  static async recordHistory(tx, { subscriptionId, previousStatus, newStatus, action, actorId, notes, metadata }) {
    await tx.subscriptionHistory.create({
      data: {
        subscriptionId,
        previousStatus: previousStatus || null,
        newStatus,
        action,
        actorId: actorId || null,
        notes: notes || null,
        metadata: metadata || null
      }
    });

    await tx.systemAuditLog.create({
      data: {
        action: `SUBSCRIPTION_${action.toUpperCase()}`,
        entity: 'Subscription',
        entityId: subscriptionId,
        actorId: actorId || null,
        metadata: { previousStatus, newStatus, notes }
      }
    });
  }

  /**
   * Confirms a subscription (DRAFT/QUOTATION -> CONFIRMED)
   */
  static async confirm(subscriptionId, actor) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'CONFIRMED');

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'CONFIRMED' }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'CONFIRMED',
        action: 'CONFIRM',
        actorId: actor.id,
        notes: 'Subscription confirmed'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription confirmed');
    return updated;
  }

  /**
   * Activates a subscription (CONFIRMED -> ACTIVE)
   */
  static async activate(subscriptionId, actor) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'ACTIVE');

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          startDate: sub.startDate || new Date()
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'ACTIVE',
        action: 'ACTIVATE',
        actorId: actor.id,
        notes: 'Subscription activated'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription activated');
    return updated;
  }

  /**
   * Pauses an active subscription (ACTIVE -> PAUSED)
   * Enforces plan.allowPause rule!
   */
  static async pause(subscriptionId, actor, reason = null) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'PAUSED');

    // Rule: Plan must permit pausing
    if (!sub.plan.allowPause) {
      throw AppError.badRequest(
        `Subscription plan '${sub.plan.name}' does not allow pausing.`,
        null,
        'PAUSE_NOT_ALLOWED'
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'PAUSED',
          pausedAt: new Date()
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'PAUSED',
        action: 'PAUSE',
        actorId: actor.id,
        notes: reason || 'Subscription paused'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription paused');
    return updated;
  }

  /**
   * Resumes a paused subscription (PAUSED -> ACTIVE)
   */
  static async resume(subscriptionId, actor) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'ACTIVE');

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          pausedAt: null
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'ACTIVE',
        action: 'RESUME',
        actorId: actor.id,
        notes: 'Subscription resumed from pause'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription resumed');
    return updated;
  }

  /**
   * Closes a subscription (ACTIVE/PAUSED -> CLOSED)
   * Enforces plan.allowEarlyClose if closing prior to expiry date!
   */
  static async close(subscriptionId, actor, reason = null) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'CLOSED');

    const now = new Date();
    const isEarlyClose = sub.expiryDate && sub.expiryDate > now;

    // If early closing and actor is CUSTOMER, check if plan permits early close
    if (isEarlyClose && actor.role === 'CUSTOMER' && !sub.plan.allowEarlyClose) {
      throw AppError.badRequest(
        `Subscription plan '${sub.plan.name}' does not permit early closure before expiry.`,
        null,
        'EARLY_CLOSE_NOT_ALLOWED'
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CLOSED',
          closedAt: now,
          autoRenew: false
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'CLOSED',
        action: 'CLOSE',
        actorId: actor.id,
        notes: reason || 'Subscription closed'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription closed');
    return updated;
  }

  /**
   * Cancels a subscription
   */
  static async cancel(subscriptionId, actor, reason = null) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    this.assertValidTransition(sub.status, 'CANCELLED');

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          closedAt: new Date(),
          autoRenew: false
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: 'CANCELLED',
        action: 'CANCEL',
        actorId: actor.id,
        notes: reason || 'Subscription cancelled'
      });

      return s;
    });

    logger.info({ subscriptionId, actorId: actor.id }, 'Subscription cancelled');
    return updated;
  }

  /**
   * Renews a subscription
   * Enforces plan.allowRenewal rule and extends nextBillingDate / expiryDate!
   */
  static async renew(subscriptionId, actor) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!sub) {
      throw AppError.notFound('Subscription not found.', null, 'SUBSCRIPTION_NOT_FOUND');
    }

    if (sub.status !== 'ACTIVE' && sub.status !== 'CONFIRMED') {
      throw AppError.badRequest(`Cannot renew subscription in '${sub.status}' state.`, null, 'CANNOT_RENEW');
    }

    if (!sub.plan.allowRenewal) {
      throw AppError.badRequest(`Subscription plan '${sub.plan.name}' does not allow renewal.`, null, 'RENEWAL_NOT_ALLOWED');
    }

    // Compute extended dates
    const currentNextBilling = sub.nextBillingDate || new Date();
    const newNextBilling = addBillingInterval(currentNextBilling, sub.billingInterval, sub.plan.billingIntervalCount || 1);
    const newExpiry = sub.expiryDate ? addBillingInterval(sub.expiryDate, sub.billingInterval, sub.plan.billingIntervalCount || 1) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          nextBillingDate: newNextBilling,
          expiryDate: newExpiry
        }
      });

      await this.recordHistory(tx, {
        subscriptionId,
        previousStatus: sub.status,
        newStatus: sub.status,
        action: 'RENEW',
        actorId: actor.id,
        notes: `Subscription renewed. Next billing: ${newNextBilling.toISOString()}`
      });

      return s;
    });

    logger.info({ subscriptionId, newNextBilling }, 'Subscription renewed successfully');
    return updated;
  }
}

export default SubscriptionLifecycleService;
