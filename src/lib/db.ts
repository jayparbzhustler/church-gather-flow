// IndexedDB wrapper for offline church attendance storage

export interface Member {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  groupId: string;
  subgroupId: string;
  createdAt: Date;
}

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
  private db: IDBDatabase | null = null;
  private dbName = 'ChurchAttendanceDB';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('groups')) {
          const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
          groupStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('subgroups')) {
          const subgroupStore = db.createObjectStore('subgroups', { keyPath: 'id' });
          subgroupStore.createIndex('groupId', 'groupId', { unique: false });
        }

        if (!db.objectStoreNames.contains('members')) {
          const memberStore = db.createObjectStore('members', { keyPath: 'id' });
          memberStore.createIndex('groupId', 'groupId', { unique: false });
          memberStore.createIndex('subgroupId', 'subgroupId', { unique: false });
          memberStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('memberId', 'memberId', { unique: false });
          attendanceStore.createIndex('serviceDate', 'serviceDate', { unique: false });
          attendanceStore.createIndex('checkInTime', 'checkInTime', { unique: false });
        }
      };
    });
  }

  // Groups
  async addGroup(group: Omit<Group, 'id' | 'createdAt'>): Promise<Group> {
    const newGroup: Group = {
      ...group,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const transaction = this.db!.transaction(['groups'], 'readwrite');
    const store = transaction.objectStore('groups');
    await store.add(newGroup);
    return newGroup;
  }

  async getGroups(): Promise<Group[]> {
    const transaction = this.db!.transaction(['groups'], 'readonly');
    const store = transaction.objectStore('groups');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Subgroups
  async addSubgroup(subgroup: Omit<Subgroup, 'id' | 'createdAt'>): Promise<Subgroup> {
    const newSubgroup: Subgroup = {
      ...subgroup,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const transaction = this.db!.transaction(['subgroups'], 'readwrite');
    const store = transaction.objectStore('subgroups');
    await store.add(newSubgroup);
    return newSubgroup;
  }

  async getSubgroupsByGroup(groupId: string): Promise<Subgroup[]> {
    const transaction = this.db!.transaction(['subgroups'], 'readonly');
    const store = transaction.objectStore('subgroups');
    const index = store.index('groupId');
    const request = index.getAll(groupId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Members
  async addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    const newMember: Member = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const transaction = this.db!.transaction(['members'], 'readwrite');
    const store = transaction.objectStore('members');
    await store.add(newMember);
    return newMember;
  }

  async getMembersBySubgroup(subgroupId: string): Promise<Member[]> {
    const transaction = this.db!.transaction(['members'], 'readonly');
    const store = transaction.objectStore('members');
    const index = store.index('subgroupId');
    const request = index.getAll(subgroupId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMembers(): Promise<Member[]> {
    const transaction = this.db!.transaction(['members'], 'readonly');
    const store = transaction.objectStore('members');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Attendance
  async markAttendance(memberId: string): Promise<AttendanceRecord> {
    // Get member details
    const transaction = this.db!.transaction(['members', 'groups', 'subgroups', 'attendance'], 'readwrite');
    const memberStore = transaction.objectStore('members');
    const member: Member = await new Promise((resolve, reject) => {
      const request = memberStore.get(memberId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Get group and subgroup names
    const groupStore = transaction.objectStore('groups');
    const subgroupStore = transaction.objectStore('subgroups');
    
    const group: Group = await new Promise((resolve, reject) => {
      const request = groupStore.get(member.groupId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const subgroup: Subgroup = await new Promise((resolve, reject) => {
      const request = subgroupStore.get(member.subgroupId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const attendance: AttendanceRecord = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      gender: member.gender,
      groupName: group.name,
      subgroupName: subgroup.name,
      checkInTime: new Date(),
      serviceDate: new Date().toISOString().split('T')[0],
      status: 'Present',
    };

    const attendanceStore = transaction.objectStore('attendance');
    await attendanceStore.add(attendance);
    return attendance;
  }

  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const transaction = this.db!.transaction(['attendance'], 'readonly');
    const store = transaction.objectStore('attendance');
    const index = store.index('serviceDate');
    const request = index.getAll(today);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    const transaction = this.db!.transaction(['attendance'], 'readonly');
    const store = transaction.objectStore('attendance');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Initialize default data
  async initializeDefaultData(): Promise<void> {
    const groups = await this.getGroups();
    if (groups.length === 0) {
      // Create default groups
      for (let i = 1; i <= 7; i++) {
        const group = await this.addGroup({ name: `Group-${i}` });
        
        // Create default subgroups for each group
        await this.addSubgroup({ name: `${i}-1`, groupId: group.id });
        await this.addSubgroup({ name: `${i}-2`, groupId: group.id });
      }

      // Add some sample members
      const allGroups = await this.getGroups();
      const firstGroup = allGroups[0];
      const subgroups = await this.getSubgroupsByGroup(firstGroup.id);
      
      if (subgroups.length > 0) {
        await this.addMember({
          name: 'John Doe',
          gender: 'Male',
          groupId: firstGroup.id,
          subgroupId: subgroups[0].id,
        });
        
        await this.addMember({
          name: 'Jane Smith',
          gender: 'Female',
          groupId: firstGroup.id,
          subgroupId: subgroups[0].id,
        });
      }
    }
  }
}

export const churchDB = new ChurchDB();