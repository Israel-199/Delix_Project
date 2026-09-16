export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Admin {
  id: string;
  email: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  employeeCount?: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  employeeCount?: number;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  employeeCount?: number;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  hireDate: string;
  status: EmployeeStatus;
  departmentId: string;
  roleId: string;
  shiftId: string;
  department?: { id: string; name: string };
  role?: { id: string; name: string };
  shift?: { id: string; name: string; startTime: string; endTime: string };
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string };
  };
}

export interface DashboardSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalRoles: number;
  totalShifts: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  todayLeave: number;
}

export interface AttendanceSummaryReport {
  employeeId: string;
  employeeName: string;
  department: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendanceRate: number;
}

export interface DepartmentAttendanceReport {
  departmentId: string;
  department: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendanceRate: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
