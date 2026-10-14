import dayjs from 'dayjs';
import LeaveBalance from '../models/LeaveBalance.js';
import config from '../config/config.js';

export class LeaveAllocationService {
  constructor() {
    this.DEFAULT_ANNUAL_ALLOCATION = config.leave.defaultAnnualAllocation || 20.0;
    this.MAX_CARRY_FORWARD = config.leave.maxCarryForward || 5.0;
  }

  /**
   * Calculate base prorated annual leave allocation for a user in a specific calendar year
   * based on their Date of Joining.
   *
   * @param {Object} user
   * @param {number} year
   * @returns {number}
   */
  calculateAnnualAllocation(user, year) {
    const annualTarget = this.DEFAULT_ANNUAL_ALLOCATION;
    const monthlyRate = annualTarget / 12.0;

    if (!user.joining_date) {
      return annualTarget;
    }

    const joiningDate = dayjs(user.joining_date);
    const joiningYear = joiningDate.year();

    if (joiningYear < year) {
      return annualTarget;
    }

    if (joiningYear > year) {
      return 0.0;
    }

    // Joined during target year -> Prorate for remaining months with day precision
    const joiningMonth = joiningDate.month() + 1; // 1-indexed (1 to 12)
    const daysInMonth = joiningDate.daysInMonth();
    const remainingDaysInMonth = daysInMonth - joiningDate.date() + 1;
    const monthFraction = remainingDaysInMonth / daysInMonth;
    const remainingMonths = (12 - joiningMonth) + monthFraction;

    return Math.round(remainingMonths * monthlyRate * 10) / 10;
  }

  /**
   * Calculate carry forward days from the previous calendar year.
   *
   * @param {Object} user
   * @param {number} year
   * @returns {Promise<number>}
   */
  async calculateCarryForward(user, year) {
    const previousYearBalance = await LeaveBalance.findOne({
      where: {
        user_id: user.id,
        year: year - 1,
      },
    });

    if (!previousYearBalance) {
      return 0.0;
    }

    const unusedBalance = parseFloat(previousYearBalance.balance);
    const maxCarryForward = this.MAX_CARRY_FORWARD;

    return Math.min(maxCarryForward, Math.max(0.0, unusedBalance));
  }

  /**
   * Calculate total initial allocation (New Allocation + Carry Forward) for a given year.
   *
   * @param {Object} user
   * @param {number} year
   * @returns {Promise<number>}
   */
  async calculateTotalOpeningAllocation(user, year) {
    const newAllocation = this.calculateAnnualAllocation(user, year);
    const carryForward = await this.calculateCarryForward(user, year);

    return Math.round((newAllocation + carryForward) * 10) / 10;
  }
}

export default new LeaveAllocationService();
