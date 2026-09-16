import dotenv from 'dotenv';
import path from 'path';
import { AttendanceStatus, EmployeeStatus, PrismaClient } from '@prisma/client';
import { ensureAdminExists } from '../src/services/authService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const departments = [
  { name: 'Front Office', description: 'Guest reception and front desk operations' },
  { name: 'Housekeeping', description: 'Room cleaning and maintenance of guest areas' },
  { name: 'Food & Beverage', description: 'Restaurant, bar, and catering services' },
  { name: 'Maintenance', description: 'Building and equipment maintenance' },
  { name: 'Human Resources', description: 'Employee relations and recruitment' },
];

const roles = [
  { name: 'Manager', description: 'Department management and oversight' },
  { name: 'Receptionist', description: 'Front desk and guest services' },
  { name: 'Housekeeper', description: 'Room cleaning and preparation' },
  { name: 'Chef', description: 'Kitchen and food preparation' },
  { name: 'Waiter', description: 'Restaurant service and guest dining' },
  { name: 'Maintenance Technician', description: 'Repairs and facility upkeep' },
  { name: 'HR Officer', description: 'Human resources administration' },
];

const shifts = [
  { name: 'Morning', startTime: '06:00', endTime: '14:00', description: 'Early shift' },
  { name: 'Afternoon', startTime: '14:00', endTime: '22:00', description: 'Mid-day shift' },
  { name: 'Night', startTime: '22:00', endTime: '06:00', description: 'Overnight shift' },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding database...');

  await ensureAdminExists();
  console.log('Admin account ensured.');

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  for (const shift of shifts) {
    const existing = await prisma.shift.findFirst({ where: { name: shift.name } });
    if (!existing) {
      await prisma.shift.create({ data: shift });
    }
  }

  const deptMap = Object.fromEntries(
    (await prisma.department.findMany()).map((d) => [d.name, d.id])
  );
  const roleMap = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.name, r.id]));
  const shiftMap = Object.fromEntries((await prisma.shift.findMany()).map((s) => [s.name, s.id]));

  const employees = [
    {
      employeeNumber: 'EMP001',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah.mitchell@hotel.com',
      phone: '+1-555-0101',
      hireDate: daysAgo(730),
      departmentId: deptMap['Front Office'],
      roleId: roleMap['Manager'],
      shiftId: shiftMap['Morning'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP002',
      firstName: 'James',
      lastName: 'Cooper',
      email: 'james.cooper@hotel.com',
      phone: '+1-555-0102',
      hireDate: daysAgo(365),
      departmentId: deptMap['Front Office'],
      roleId: roleMap['Receptionist'],
      shiftId: shiftMap['Afternoon'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP003',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@hotel.com',
      phone: '+1-555-0103',
      hireDate: daysAgo(540),
      departmentId: deptMap['Housekeeping'],
      roleId: roleMap['Housekeeper'],
      shiftId: shiftMap['Morning'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP004',
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@hotel.com',
      phone: '+1-555-0104',
      hireDate: daysAgo(180),
      departmentId: deptMap['Housekeeping'],
      roleId: roleMap['Housekeeper'],
      shiftId: shiftMap['Night'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP005',
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@hotel.com',
      phone: '+1-555-0105',
      hireDate: daysAgo(900),
      departmentId: deptMap['Food & Beverage'],
      roleId: roleMap['Chef'],
      shiftId: shiftMap['Morning'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP006',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@hotel.com',
      phone: '+1-555-0106',
      hireDate: daysAgo(120),
      departmentId: deptMap['Food & Beverage'],
      roleId: roleMap['Waiter'],
      shiftId: shiftMap['Afternoon'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP007',
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'robert.wilson@hotel.com',
      phone: '+1-555-0107',
      hireDate: daysAgo(450),
      departmentId: deptMap['Maintenance'],
      roleId: roleMap['Maintenance Technician'],
      shiftId: shiftMap['Morning'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP008',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@hotel.com',
      phone: '+1-555-0108',
      hireDate: daysAgo(600),
      departmentId: deptMap['Human Resources'],
      roleId: roleMap['HR Officer'],
      shiftId: shiftMap['Morning'],
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP009',
      firstName: 'Thomas',
      lastName: 'Lee',
      email: 'thomas.lee@hotel.com',
      phone: '+1-555-0109',
      hireDate: daysAgo(90),
      departmentId: deptMap['Front Office'],
      roleId: roleMap['Receptionist'],
      shiftId: shiftMap['Night'],
      status: EmployeeStatus.ON_LEAVE,
    },
    {
      employeeNumber: 'EMP010',
      firstName: 'Anna',
      lastName: 'Martinez',
      email: 'anna.martinez@hotel.com',
      phone: '+1-555-0110',
      hireDate: daysAgo(300),
      departmentId: deptMap['Food & Beverage'],
      roleId: roleMap['Waiter'],
      shiftId: shiftMap['Night'],
      status: EmployeeStatus.INACTIVE,
    },
  ];

  const createdEmployees = [];
  for (const emp of employees) {
    const employee = await prisma.employee.upsert({
      where: { employeeNumber: emp.employeeNumber },
      update: {},
      create: emp,
    });
    createdEmployees.push(employee);
  }

  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.LEAVE,
  ];

  for (const employee of createdEmployees) {
    if (employee.status === EmployeeStatus.INACTIVE) continue;

    for (let i = 0; i < 25; i++) {
      const date = daysAgo(i);
      const status = statuses[i % statuses.length];

      await prisma.attendance.upsert({
        where: {
          employeeId_date: { employeeId: employee.id, date },
        },
        update: {},
        create: {
          employeeId: employee.id,
          date,
          status,
          checkIn: status === AttendanceStatus.ABSENT ? null : '08:00',
          checkOut: status === AttendanceStatus.ABSENT ? null : '16:00',
          notes: status === AttendanceStatus.LATE ? 'Traffic delay' : null,
        },
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
