// Simple Google Sheets database client using Netlify functions
export interface Group {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Subgroup {
  id: string;
  name: string;
  groupId: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  groupId: string;
  subgroupId: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  gender: 'Male' | 'Female';
  groupName: string;
  subgroupName: string;
  checkInTime: Date;
  serviceDate: string;
  status: 'Present' | 'Absent';
}

class ChurchDB {
  private baseUrl = '/.netlify/functions';

  async getMembersBySubgroup(subgroupId: string): Promise<Member[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-members?subgroupId=${subgroupId}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }

  async getGroups(): Promise<Group[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async addGroup(group: Omit<Group, 'id'>): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/add-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error('Failed to add group');
      const data = await response.json();
      return data.group;
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  }

  async getSubgroups(groupId?: string): Promise<Subgroup[]> {
    try {
      const url = groupId 
        ? `${this.baseUrl}/get-subgroups?groupId=${groupId}`
        : `${this.baseUrl}/get-subgroups`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch subgroups');
      const data = await response.json();
      return data.subgroups || [];
    } catch (error) {
      console.error('Error fetching subgroups:', error);
      return [];
    }
  }

  async addSubgroup(subgroup: Omit<Subgroup, 'id'>): Promise<Subgroup> {
    try {
      const response = await fetch(`${this.baseUrl}/add-subgroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subgroup),
      });
      if (!response.ok) throw new Error('Failed to add subgroup');
      const data = await response.json();
      return data.subgroup;
    } catch (error) {
      console.error('Error adding subgroup:', error);
      throw error;
    }
  }

  async getMembers(subgroupId?: string): Promise<Member[]> {
    try {
      const url = subgroupId 
        ? `${this.baseUrl}/get-members?subgroupId=${subgroupId}`
        : `${this.baseUrl}/get-members`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    try {
      const response = await fetch(`${this.baseUrl}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to add member');
      const data = await response.json();
      return data.member;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  async markAttendance(record: Omit<AttendanceRecord, 'id' | 'checkInTime'>): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error('Failed to mark attendance');
      const data = await response.json();
      return data.attendance;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-today-attendance`);
      if (!response.ok) throw new Error('Failed to fetch today\'s attendance');
      const data = await response.json();
      return data.attendance || [];
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
      return [];
    }
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-all-attendance`);
      if (!response.ok) throw new Error('Failed to fetch all attendance');
      const data = await response.json();
      return data.attendance || [];
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      return [];
    }
  }
}

export const churchDB = new ChurchDB();
