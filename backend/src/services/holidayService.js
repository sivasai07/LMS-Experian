import { Op } from 'sequelize';
import dayjs from 'dayjs';
import Holiday from '../models/Holiday.js';
import { DomainException } from '../utils/exceptions.js';

export class HolidayService {
  async all() {
    return Holiday.findAll({
      order: [['holiday_date', 'ASC']],
    });
  }

  async findById(id) {
    const holiday = await Holiday.findByPk(id);
    if (!holiday) {
      throw DomainException.notFound('Holiday');
    }
    return holiday;
  }

  async create(data) {
    return Holiday.create(data);
  }

  async update(id, data) {
    const holiday = await this.findById(id);
    await holiday.update(data);
    return holiday.reload();
  }

  async delete(id) {
    const holiday = await this.findById(id);
    await holiday.destroy();
  }

  async getHolidayDatesForYear(year) {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const holidays = await Holiday.findAll({
      where: {
        holiday_date: {
          [Op.between]: [startOfYear, endOfYear],
        },
      },
    });

    return holidays.map((h) => dayjs(h.holiday_date).format('YYYY-MM-DD'));
  }
}

export default new HolidayService();
