import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getTodayDateRange } from '../utils/response';

export async function getDashboardSummary() {
  const today = getTodayDateRange();
  const todayDate = new Date();
  todayDate.setUTCHours(0, 0, 0, 0);

  const [
    totalEmployees,
    totalDepartments,
    totalRoles,
    totalShifts,
    todayPresent,
    todayAbsent,
    todayLate,
    todayLeave,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.department.count(),
    prisma.role.count(),
    prisma.shift.count(),
    prisma.attendance.count({ where: { date: todayDate, status: AttendanceStatus.PRESENT } }),
    prisma.attendance.count({ where: { date: todayDate, status: AttendanceStatus.ABSENT } }),
    prisma.attendance.count({ where: { date: todayDate, status: AttendanceStatus.LATE } }),
    prisma.attendance.count({ where: { date: todayDate, status: AttendanceStatus.LEAVE } }),
  ]);

  return {
    totalEmployees,
    totalDepartments,
    totalRoles,
    totalShifts,
    todayPresent,
    todayAbsent,
    todayLate,
    todayLeave,
  };
}

export async function getAttendanceSummaryReport(startDate?: string, endDate?: string) {
  const dateFilter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    dateFilter.gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: { select: { name: true } },
      attendance: {
        where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
        select: { status: true },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return employees.map((emp) => {
    const totalDays = emp.attendance.length;
    const present = emp.attendance.filter((a) => a.status === 'PRESENT').length;
    const absent = emp.attendance.filter((a) => a.status === 'ABSENT').length;
    const late = emp.attendance.filter((a) => a.status === 'LATE').length;
    const leave = emp.attendance.filter((a) => a.status === 'LEAVE').length;
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department.name,
      totalDays,
      present,
      absent,
      late,
      leave,
      attendanceRate,
    };
  });
}

export async function getDepartmentAttendanceReport(startDate?: string, endDate?: string) {
  const dateFilter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    dateFilter.gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      employees: {
        select: {
          id: true,
          attendance: {
            where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
            select: { status: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map((dept) => {
    const totalEmployees = dept.employees.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let totalRecords = 0;

    for (const emp of dept.employees) {
      for (const record of emp.attendance) {
        totalRecords++;
        if (record.status === 'PRESENT') present++;
        else if (record.status === 'ABSENT') absent++;
        else if (record.status === 'LATE') late++;
        else if (record.status === 'LEAVE') leave++;
      }
    }

    const attendanceRate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;

    return {
      departmentId: dept.id,
      department: dept.name,
      totalEmployees,
      present,
      absent,
      late,
      leave,
      attendanceRate,
    };
  });
}
