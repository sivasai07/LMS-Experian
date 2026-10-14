import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import { DomainException } from '../utils/exceptions.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export class WorkingDayService {
  /**
   * Check whether a given date is a working day (not weekend and not holiday).
   *
   * @param {dayjs.Dayjs|string} date
   * @param {string[]} holidayDates - Array of 'YYYY-MM-DD' strings
   * @returns {boolean}
   */
  isWorkingDay(date, holidayDates = []) {
    const d = dayjs(date);
    const dayOfWeek = d.day(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = d.format('YYYY-MM-DD');
    const isHoliday = holidayDates.includes(dateStr);

    return !isWeekend && !isHoliday;
  }

  /**
   * Calculate working days between two dates (inclusive),
   * excluding weekends and company holidays.
   *
   * @param {string|Date|dayjs.Dayjs} startInput
   * @param {string|Date|dayjs.Dayjs} endInput
   * @param {string[]} holidayDates - List of holiday dates (YYYY-MM-DD)
   * @param {string|null} startHalfDay - 'first_half', 'second_half', or null (full day)
   * @param {string|null} endHalfDay - 'first_half', 'second_half', or null (full day)
   * @returns {number}
   */
  calculate(startInput, endInput, holidayDates = [], startHalfDay = null, endHalfDay = null) {
    const start = dayjs(startInput).startOf('day');
    const end = dayjs(endInput).startOf('day');

    if (start.isAfter(end)) {
      return 0.0;
    }

    // Single-day calculation
    if (start.isSame(end, 'day')) {
      if (!this.isWorkingDay(start, holidayDates)) {
        return 0.0;
      }

      if (startHalfDay !== null && startHalfDay !== undefined || endHalfDay !== null && endHalfDay !== undefined) {
        if (startHalfDay === 'first_half' && endHalfDay === 'second_half') {
          return 1.0;
        }
        if (startHalfDay === 'second_half' && endHalfDay === 'first_half') {
          throw new DomainException(
            'Invalid half-day combination: start half-day cannot be second half when end half-day is first half on the same day.',
            'INVALID_HALF_DAY_COMBINATION',
            422
          );
        }
        return 0.5;
      }

      return 1.0;
    }

    // Multi-day calculation
    let days = 0.0;
    let current = start;

    while (current.isSameOrBefore(end, 'day')) {
      if (!this.isWorkingDay(current, holidayDates)) {
        current = current.add(1, 'day');
        continue;
      }

      const isStart = current.isSame(start, 'day');
      const isEnd = current.isSame(end, 'day');

      if (isStart) {
        if (startHalfDay === 'second_half') {
          days += 0.5;
        } else {
          days += 1.0;
        }
      } else if (isEnd) {
        if (endHalfDay === 'first_half') {
          days += 0.5;
        } else {
          days += 1.0;
        }
      } else {
        days += 1.0;
      }

      current = current.add(1, 'day');
    }

    return days;
  }
}

export default new WorkingDayService();
