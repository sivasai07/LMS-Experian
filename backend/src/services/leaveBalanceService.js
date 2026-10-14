import dayjs from 'dayjs';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';
import leaveAllocationService from './leaveAllocationService.js';
import config from '../config/config.js';
import { DomainException } from '../utils/exceptions.js';

export class LeaveBalanceService {
  /**
   * Get or create the common leave balance for a specific user.
   *
   * @param {number} userId
   * @param {number|null} year
   * @returns {Promise<LeaveBalance>}
   */
  async balancesForUser(userId, year = null) {
    const currentYear = dayjs().year();
    return this.getOrCreate(userId, year || currentYear);
  }

  /**
   * Get or automatically create the single common leave balance record for a user + year.
   *
   * @param {number} userId
   * @param {number|null} year
   * @param {number|null} overrideAllocation
   * @param {Object|null} transaction
   * @returns {Promise<LeaveBalance>}
   */
  async getOrCreate(userId, year = null, overrideAllocation = null, transaction = null) {
    const targetYear = year || dayjs().year();

    const existing = await LeaveBalance.findOne({
      where: {
        user_id: userId,
        year: targetYear,
      },
      transaction,
    });

    if (existing) {
      return existing;
    }

    let allocation = overrideAllocation;

    if (allocation === null || allocation === undefined) {
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        allocation = await leaveAllocationService.calculateTotalOpeningAllocation(user, targetYear);
      } else {
        allocation = config.leave.defaultAnnualAllocation;
      }
    }

    return LeaveBalance.create(
      {
        user_id: userId,
        year: targetYear,
        allocated: allocation,
        used: 0.00,
        balance: allocation,
      },
      { transaction }
    );
  }

  /**
   * Deduct working days from common balance upon leave approval / application.
   * Enforces the maximum allowed negative balance (-5 days).
   *
   * @param {LeaveBalance} balance
   * @param {number} days
   * @param {number} negativeLimit Default 5.0 (allows balance down to -5.0)
   * @param {Object|null} transaction
   */
  async deduct(balance, days, negativeLimit = 5.0, transaction = null) {
    const curBalance = parseFloat(balance.balance);
    if ((curBalance - days) < -negativeLimit) {
      throw new DomainException(
        `Insufficient leave balance. Current balance is ${curBalance} days. Request requires ${days} days, exceeding the maximum allowed negative balance limit of -${negativeLimit} days.`,
        'INSUFFICIENT_BALANCE',
        422
      );
    }

    balance.used = parseFloat(balance.used) + days;
    balance.balance = curBalance - days;
    await balance.save({ transaction });
  }

  /**
   * Restore working days to common balance upon cancellation or rejection of a leave request.
   *
   * @param {LeaveBalance} balance
   * @param {number} days
   * @param {Object|null} transaction
   */
  async restore(balance, days, transaction = null) {
    balance.used = Math.max(0.0, parseFloat(balance.used) - days);
    balance.balance = parseFloat(balance.balance) + days;
    await balance.save({ transaction });
  }
}

export default new LeaveBalanceService();
