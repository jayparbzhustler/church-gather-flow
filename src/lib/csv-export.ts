// CSV Export functionality for church attendance data

import { AttendanceRecord } from './db';

export function exportAttendanceToCSV(attendanceData: AttendanceRecord[]): void {
  // CSV Headers
  const headers = [
    'ID',
    'Name', 
    'Gender',
    'Group',
    'Subgroup',
    'Check-In Time',
    'Service ID',
    'Status'
  ];

  // Convert data to CSV rows
  const rows = attendanceData.map((record, index) => [
    String(index + 1).padStart(3, '0'), // Sequential ID
    record.memberName,
    record.gender,
    record.groupName,
    record.subgroupName,
    record.checkInTime.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/,/g, ''),
    `${getServiceName(record.checkInTime)} Service`,
    record.status
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const today = new Date();
  const filename = `attendance_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function getServiceName(checkInTime: Date): string {
  const hour = checkInTime.getHours();
  
  if (hour < 12) {
    return 'Morning';
  } else if (hour < 17) {
    return 'Afternoon';  
  } else {
    return 'Evening';
  }
}

export function generateAttendanceReport(attendanceData: AttendanceRecord[]) {
  const totalAttendees = attendanceData.length;
  const genderStats = attendanceData.reduce((acc, record) => {
    acc[record.gender] = (acc[record.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const groupStats = attendanceData.reduce((acc, record) => {
    acc[record.groupName] = (acc[record.groupName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAttendees,
    genderStats,
    groupStats,
    serviceDate: attendanceData[0]?.serviceDate || new Date().toISOString().split('T')[0]
  };
}