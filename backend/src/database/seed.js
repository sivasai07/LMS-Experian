import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';
import '../models/index.js'; // load associations
import Role from '../models/Role.js';
import Department from '../models/Department.js';
import Grade from '../models/Grade.js';
import JobTitle from '../models/JobTitle.js';
import GradeJobTitle from '../models/GradeJobTitle.js';
import LeaveType from '../models/LeaveType.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
import LeaveBalance from '../models/LeaveBalance.js';
import leaveAllocationService from '../services/leaveAllocationService.js';

export async function runSeed() {
  console.log('--- Starting Database Synchronization & Clean Seeding ---');

  // Disable FK checks to allow clean recreation
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.sync({ force: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✓ Database tables cleanly recreated.');

  // 1. Roles
  const rolesData = [
    { name: 'HR', description: 'Full access to all employees, leave records, and master data.' },
    { name: 'Manager', description: 'Can view and approve/reject leave requests for direct reports.' },
    { name: 'Employee', description: 'Can apply for leave and view their own leave history and balance.' },
  ];

  const roleMap = {};
  for (const r of rolesData) {
    const role = await Role.create(r);
    roleMap[r.name] = role.id;
  }
  console.log('✓ Roles seeded.');

  // 2. Departments
  const departmentNames = [
    'Engineering',
    'Quality Assurance',
    'Product Management',
    'Data & Analytics',
    'DevOps & Infrastructure',
    'Design',
    'Human Resources',
    'Finance',
    'Sales',
    'Operations',
  ];

  const deptMap = {};
  for (const name of departmentNames) {
    const dept = await Department.create({ name });
    deptMap[name] = dept.id;
  }
  console.log('✓ Departments seeded.');

  // 3. Grades (EB11 down to EB1, where EB11 is entry-level / fresher)
  const gradeList = [
    { code: 'EB11', description: 'Entry Level / Fresher / Trainee' },
    { code: 'EB10', description: 'Associate Level' },
    { code: 'EB9', description: 'Software Engineer / QA / Analyst / Designer' },
    { code: 'EB8', description: 'Senior Engineer / DevOps Specialist' },
    { code: 'EB7', description: 'Technical Lead / Data Scientist' },
    { code: 'EB6', description: 'Software Architect' },
    { code: 'EB5', description: 'Manager / Product Manager / HR Manager' },
    { code: 'EB4', description: 'Engineering Manager' },
    { code: 'EB3', description: 'Senior / Associate Director' },
    { code: 'EB2', description: 'Director' },
    { code: 'EB1', description: 'Executive / Leadership' },
  ];

  const gradeMap = {};
  for (const g of gradeList) {
    const grade = await Grade.create(g);
    gradeMap[g.code] = grade.id;
  }
  console.log('✓ Grades seeded (EB11 to EB1).');

  // 4. Job Titles
  const jobTitles = [
    'Trainee Software Engineer',
    'Associate Software Engineer',
    'Software Engineer',
    'Senior Software Engineer',
    'Technical Lead',
    'Engineering Manager',
    'Software Architect',
    'DevOps Engineer',
    'QA Engineer',
    'Data Analyst',
    'Data Scientist',
    'Product Manager',
    'UI/UX Designer',
    'HR Executive',
    'HR Manager',
    'Director',
  ];

  const jobTitleMap = {};
  for (const title of jobTitles) {
    const jt = await JobTitle.create({ title });
    jobTitleMap[title] = jt.id;
  }
  console.log('✓ Job titles seeded.');

  // 5. GradeJobTitles mapping (EB11 is fresher)
  const mappings = [
    { title: 'Trainee Software Engineer', grade: 'EB11' }, // Fresher
    { title: 'Associate Software Engineer', grade: 'EB10' },
    { title: 'HR Executive', grade: 'EB10' },
    { title: 'Software Engineer', grade: 'EB9' },
    { title: 'QA Engineer', grade: 'EB9' },
    { title: 'Data Analyst', grade: 'EB9' },
    { title: 'UI/UX Designer', grade: 'EB9' },
    { title: 'Senior Software Engineer', grade: 'EB8' },
    { title: 'DevOps Engineer', grade: 'EB8' },
    { title: 'Technical Lead', grade: 'EB7' },
    { title: 'Data Scientist', grade: 'EB7' },
    { title: 'Software Architect', grade: 'EB6' },
    { title: 'Product Manager', grade: 'EB5' },
    { title: 'HR Manager', grade: 'EB5' },
    { title: 'Engineering Manager', grade: 'EB4' },
    { title: 'Director', grade: 'EB2' },
  ];

  const gradeJobTitleMap = {};
  for (const m of mappings) {
    const gradeId = gradeMap[m.grade];
    const jtId = jobTitleMap[m.title];
    const gjt = await GradeJobTitle.create({
      grade_id: gradeId,
      job_title_id: jtId,
    });
    gradeJobTitleMap[m.title] = gjt.id;
  }
  console.log('✓ Grade-job title mappings seeded with EB grades.');

  // 6. Leave Types: annual(25), sick(10), bereavement(5), paternity(5), maternity(5), family care(2), other leave(5)
  const leaveTypes = [
    {
      name: 'Annual Leave',
      annual_quota: 25,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for planned annual vacation and personal time off.',
    },
    {
      name: 'Sick Leave',
      annual_quota: 10,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for illness or medical absence.',
    },
    {
      name: 'Bereavement Leave',
      annual_quota: 5,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for bereavement and family mourning.',
    },
    {
      name: 'Paternity Leave',
      annual_quota: 5,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for new fathers following child birth.',
    },
    {
      name: 'Maternity Leave',
      annual_quota: 5,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for expectant and new mothers.',
    },
    {
      name: 'Family Care Leave',
      annual_quota: 2,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for immediate family care and emergency assistance.',
    },
    {
      name: 'Other Leave',
      annual_quota: 5,
      negative_limit: 5,
      half_day_allowed: true,
      description: 'Category for miscellaneous leave requests.',
    },
  ];

  for (const lt of leaveTypes) {
    await LeaveType.create(lt);
  }
  console.log('✓ Leave types seeded (annual 25, sick 10, bereavement 5, paternity 5, maternity 5, family care 2, other 5).');

  // 7. Holidays
  const currentYear = dayjs().year();
  const holidays = [
    { holiday_name: "New Year's Day", holiday_date: `${currentYear}-01-01` },
    { holiday_name: 'Republic Day', holiday_date: `${currentYear}-01-26` },
    { holiday_name: 'Independence Day', holiday_date: `${currentYear}-08-15` },
    { holiday_name: 'Gandhi Jayanti', holiday_date: `${currentYear}-10-02` },
    { holiday_name: 'Diwali', holiday_date: `${currentYear}-10-20` },
    { holiday_name: 'Christmas Day', holiday_date: `${currentYear}-12-25` },
  ];

  for (const h of holidays) {
    await Holiday.create(h);
  }
  console.log('✓ Holidays seeded.');

  // 8. Users
  const passwordHash = await bcrypt.hash('Password@123', 10);
  let nextEmpNum = 1111;

  const people = [
    // HR root account
    {
      email: 'hr@leavemanagement.test',
      first_name: 'Priya',
      last_name: 'Sharma',
      gender: 'female',
      role: 'HR',
      department: 'Human Resources',
      job_title: 'HR Manager',
      manager_email: null,
      force_password_change: false,
      monthsAgo: 24,
    },
    // Managers
    {
      email: 'director@leavemanagement.test',
      first_name: 'Arjun',
      last_name: 'Mehta',
      gender: 'male',
      role: 'Manager',
      department: 'Engineering',
      job_title: 'Director',
      manager_email: null,
      monthsAgo: 22,
    },
    {
      email: 'eng.manager@leavemanagement.test',
      first_name: 'Kavya',
      last_name: 'Reddy',
      gender: 'female',
      role: 'Manager',
      department: 'Engineering',
      job_title: 'Engineering Manager',
      manager_email: 'director@leavemanagement.test',
      monthsAgo: 18,
    },
    {
      email: 'product.manager@leavemanagement.test',
      first_name: 'Rohan',
      last_name: 'Iyer',
      gender: 'male',
      role: 'Manager',
      department: 'Product Management',
      job_title: 'Product Manager',
      manager_email: 'director@leavemanagement.test',
      monthsAgo: 16,
    },
    // Employees reporting to Engineering Manager
    {
      email: 'swe1@leavemanagement.test',
      first_name: 'Aditya',
      last_name: 'Nair',
      gender: 'male',
      role: 'Employee',
      department: 'Engineering',
      job_title: 'Software Engineer',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 12,
    },
    {
      email: 'swe2@leavemanagement.test',
      first_name: 'Ishita',
      last_name: 'Gupta',
      gender: 'female',
      role: 'Employee',
      department: 'Engineering',
      job_title: 'Software Engineer',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 10,
    },
    {
      email: 'senior.swe@leavemanagement.test',
      first_name: 'Vikram',
      last_name: 'Rao',
      gender: 'male',
      role: 'Employee',
      department: 'Engineering',
      job_title: 'Senior Software Engineer',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 15,
    },
    {
      email: 'tech.lead@leavemanagement.test',
      first_name: 'Neha',
      last_name: 'Verma',
      gender: 'female',
      role: 'Employee',
      department: 'Engineering',
      job_title: 'Technical Lead',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 14,
    },
    {
      email: 'devops@leavemanagement.test',
      first_name: 'Karan',
      last_name: 'Malhotra',
      gender: 'male',
      role: 'Employee',
      department: 'DevOps & Infrastructure',
      job_title: 'DevOps Engineer',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 8,
    },
    {
      email: 'qa@leavemanagement.test',
      first_name: 'Ananya',
      last_name: 'Joshi',
      gender: 'female',
      role: 'Employee',
      department: 'Quality Assurance',
      job_title: 'QA Engineer',
      manager_email: 'eng.manager@leavemanagement.test',
      monthsAgo: 9,
    },
    // Employees reporting to Product Manager
    {
      email: 'data.analyst@leavemanagement.test',
      first_name: 'Siddharth',
      last_name: 'Kapoor',
      gender: 'male',
      role: 'Employee',
      department: 'Data & Analytics',
      job_title: 'Data Analyst',
      manager_email: 'product.manager@leavemanagement.test',
      monthsAgo: 7,
    },
    {
      email: 'data.scientist@leavemanagement.test',
      first_name: 'Meera',
      last_name: 'Pillai',
      gender: 'female',
      role: 'Employee',
      department: 'Data & Analytics',
      job_title: 'Data Scientist',
      manager_email: 'product.manager@leavemanagement.test',
      monthsAgo: 6,
    },
    {
      email: 'designer@leavemanagement.test',
      first_name: 'Ravi',
      last_name: 'Choudhary',
      gender: 'male',
      role: 'Employee',
      department: 'Design',
      job_title: 'UI/UX Designer',
      manager_email: 'product.manager@leavemanagement.test',
      monthsAgo: 11,
    },
    // Employee reporting to HR
    {
      email: 'hr.exec@leavemanagement.test',
      first_name: 'Divya',
      last_name: 'Menon',
      gender: 'female',
      role: 'Employee',
      department: 'Human Resources',
      job_title: 'HR Executive',
      manager_email: 'hr@leavemanagement.test',
      monthsAgo: 5,
    },
  ];

  const userEmailMap = {};

  for (const person of people) {
    const managerId = person.manager_email ? userEmailMap[person.manager_email] : null;
    const joiningDate = dayjs().subtract(person.monthsAgo || 6, 'month').format('YYYY-MM-DD');

    const createdUser = await User.create({
      employee_number: String(nextEmpNum++),
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      password: passwordHash,
      gender: person.gender,
      joining_date: joiningDate,
      status: 'active',
      employment_type: 'full_time',
      force_password_change: person.force_password_change ?? true,
      role_id: roleMap[person.role],
      department_id: deptMap[person.department],
      grade_job_title_id: gradeJobTitleMap[person.job_title],
      manager_id: managerId,
    });

    userEmailMap[person.email] = createdUser.id;
  }
  console.log('✓ Users seeded.');

  // 9. Leave Balances
  const allUsers = await User.findAll();
  for (const user of allUsers) {
    const allocated = await leaveAllocationService.calculateTotalOpeningAllocation(user, currentYear);
    await LeaveBalance.create({
      user_id: user.id,
      year: currentYear,
      allocated,
      used: 0.0,
      balance: allocated,
    });
  }
  console.log('✓ Leave balances seeded with 25-day annual basis.');
  console.log('--- Clean Database Seeding Completed Successfully! ---');
}

// If run directly via `node src/database/seed.js`
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seeding error:', err);
      try {
        await sequelize.close();
      } catch (_) {}
      process.exit(1);
    });
}
