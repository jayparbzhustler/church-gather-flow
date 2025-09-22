import { useState, useEffect } from "react";
import { Download, Users, Calendar, ArrowLeft, BarChart3, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AttendanceRecord, Group, Subgroup, Member } from "@/lib/db";
import { exportAttendanceToCSV, generateAttendanceReport } from "@/lib/csv-export";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedGroupForSubgroup, setSelectedGroupForSubgroup] = useState('');
  const [selectedGroupForMember, setSelectedGroupForMember] = useState('');
  const [selectedSubgroupForMember, setSelectedSubgroupForMember] = useState('');
  const [selectedGenderForMember, setSelectedGenderForMember] = useState<'Male' | 'Female'>('Male');
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [todayResponse, allResponse, groupsResponse] = await Promise.all([
        fetch('/.netlify/functions/get-today-attendance'),
        fetch('/.netlify/functions/get-all-attendance'),
        fetch('/.netlify/functions/get-groups')
      ]);

      if (!todayResponse.ok) throw new Error('Failed to fetch today attendance');
      if (!allResponse.ok) throw new Error('Failed to fetch all attendance');
      if (!groupsResponse.ok) throw new Error('Failed to fetch groups');

      const today: AttendanceRecord[] = await todayResponse.json();
      const all: AttendanceRecord[] = await allResponse.json();
      const groupsData: Group[] = await groupsResponse.json();
      setTodayAttendance(today);
      setAllAttendance(all);
      // Sort groups by name
      const sortedGroups = groupsData.sort((a, b) => a.name.localeCompare(b.name));
      setGroups(sortedGroups);
      
      // Load subgroups and members if needed
      if (sortedGroups.length > 0) {
        const subgroupsResponse = await fetch(`/.netlify/functions/get-subgroups?groupId=${sortedGroups[0].id}`);
        if (!subgroupsResponse.ok) throw new Error('Failed to fetch subgroups');
        const subgroupsData: Subgroup[] = await subgroupsResponse.json();
        // Sort subgroups by name
        const sortedSubgroups = subgroupsData.sort((a, b) => a.name.localeCompare(b.name));
        setSubgroups(sortedSubgroups);
        
        if (sortedSubgroups.length > 0) {
          const membersResponse = await fetch(`/.netlify/functions/get-members?subgroupId=${sortedSubgroups[0].id}`);
          if (!membersResponse.ok) throw new Error('Failed to fetch members');
          const membersData: Member[] = await membersResponse.json();
          // Sort members by name
          const sortedMembers = membersData.sort((a, b) => a.name.localeCompare(b.name));
          setMembers(sortedMembers);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
      console.error('Load all data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToday = () => {
    if (todayAttendance.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records for today to export",
        variant: "destructive",
      });
      return;
    }

    exportAttendanceToCSV(todayAttendance);
    toast({
      title: "Success",
      description: "Today's attendance exported successfully",
    });
  };

  const handleExportAll = () => {
    if (allAttendance.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      });
      return;
    }

    exportAttendanceToCSV(allAttendance);
    toast({
      title: "Success",
      description: "All attendance records exported successfully",
    });
  };

  const todayReport = todayAttendance.length > 0 ? generateAttendanceReport(todayAttendance) : null;

  const addNewGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newGroup = await churchDB.addGroup({ name: newGroupName.trim() });
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      toast({
        title: "Success",
        description: `Group "${newGroupName}" added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add group",
        variant: "destructive",
      });
    }
  };

  const addNewSubgroup = async () => {
    if (!newSubgroupName.trim() || !selectedGroupForSubgroup) {
      toast({
        title: "Error",
        description: "Please enter a subgroup name and select a group",
        variant: "destructive",
      });
      return;
    }

    try {
      const newSubgroup = await churchDB.addSubgroup({
        name: newSubgroupName.trim(),
        groupId: selectedGroupForSubgroup
      });
      setSubgroups([...subgroups, newSubgroup]);
      setNewSubgroupName('');
      toast({
        title: "Success",
        description: `Subgroup "${newSubgroupName}" added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subgroup",
        variant: "destructive",
      });
    }
  };

  const addNewMember = async () => {
    if (!newMemberName.trim() || !selectedGroupForMember || !selectedSubgroupForMember) {
      toast({
        title: "Error",
        description: "Please enter member name and select group/subgroup",
        variant: "destructive",
      });
      return;
    }

    try {
      const newMember = await churchDB.addMember({
        name: newMemberName.trim(),
        gender: selectedGenderForMember,
        groupId: selectedGroupForMember,
        subgroupId: selectedSubgroupForMember
      });
      setMembers([...members, newMember]);
      setNewMemberName('');
      toast({
        title: "Success",
        description: `Member "${newMemberName}" added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleGroupChangeForSubgroup = async (groupId: string) => {
    setSelectedGroupForSubgroup(groupId);
    try {
      const subgroupsData = await churchDB.getSubgroupsByGroup(groupId);
      // Sort subgroups by name
      const sortedSubgroups = subgroupsData.sort((a, b) => a.name.localeCompare(b.name));
      setSubgroups(sortedSubgroups);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subgroups",
        variant: "destructive",
      });
    }
  };

  const handleGroupChangeForMember = async (groupId: string) => {
    setSelectedGroupForMember(groupId);
    setSelectedSubgroupForMember('');
    try {
      const subgroupsData = await churchDB.getSubgroupsByGroup(groupId);
      // Sort subgroups by name
      const sortedSubgroups = subgroupsData.sort((a, b) => a.name.localeCompare(b.name));
      setSubgroups(sortedSubgroups);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subgroups",
        variant: "destructive",
      });
    }
  };

  const handleSubgroupChangeForMember = async (subgroupId: string) => {
    setSelectedSubgroupForMember(subgroupId);
    try {
      const membersData = await churchDB.getMembersBySubgroup(subgroupId);
      // Sort members by name
      const sortedMembers = membersData.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(sortedMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
          >
            <ArrowLeft size={24} />
            Back to Kiosk
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Church Attendance Management
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="admin"
              size="lg"
              onClick={handleExportToday}
              disabled={todayAttendance.length === 0}
            >
              <Download size={20} />
              Export Today
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportAll}
              disabled={allAttendance.length === 0}
            >
              <Download size={20} />
              Export All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance.length}</div>
              <p className="text-xs text-muted-foreground">
                Total check-ins today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAttendance.length}</div>
              <p className="text-xs text-muted-foreground">
                All-time attendance records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Active</div>
              <p className="text-xs text-muted-foreground">
                Kiosk ready for check-ins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="today">Today's Report</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="subgroups">Subgroups</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance Summary</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayReport ? (
                  <div className="space-y-6">
                    {/* Gender Breakdown */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Gender Distribution</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-male/10 p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Male</p>
                          <p className="text-2xl font-bold text-male">
                            {todayReport.genderStats.Male || 0}
                          </p>
                        </div>
                        <div className="bg-female/10 p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Female</p>
                          <p className="text-2xl font-bold text-female">
                            {todayReport.genderStats.Female || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Group Breakdown */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Group Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(todayReport.groupStats).map(([group, count]) => (
                          <div key={group} className="bg-accent/10 p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{group}</p>
                            <p className="text-xl font-bold text-primary">{count}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No attendance records for today yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>
                  Latest attendance records across all services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allAttendance.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allAttendance
                      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
                      .slice(0, 50)
                      .map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{record.memberName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.groupName} → {record.subgroupName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {new Date(record.checkInTime).toLocaleString()}
                            </p>
                            <p className={`text-sm ${record.gender === 'Male' ? 'text-male' : 'text-female'}`}>
                              {record.gender}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No attendance records found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Groups</CardTitle>
                <CardDescription>Add and view church groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addNewGroup}>
                      <Plus size={16} />
                      Add Group
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {groups.map((group) => (
                      <div key={group.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subgroups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Subgroups</CardTitle>
                <CardDescription>Add and view subgroups within groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Select Group</label>
                      <select
                        value={selectedGroupForSubgroup}
                        onChange={(e) => handleGroupChangeForSubgroup(e.target.value)}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="">Select a group</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subgroup Name</label>
                      <Input
                        placeholder="Enter subgroup name"
                        value={newSubgroupName}
                        onChange={(e) => setNewSubgroupName(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={addNewSubgroup}>
                    <Plus size={16} />
                    Add Subgroup
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {subgroups.map((subgroup) => (
                      <div key={subgroup.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{subgroup.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Group: {groups.find(g => g.id === subgroup.groupId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(subgroup.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Members</CardTitle>
                <CardDescription>Add and view church members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Select Group</label>
                      <select
                        value={selectedGroupForMember}
                        onChange={(e) => handleGroupChangeForMember(e.target.value)}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="">Select a group</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Select Subgroup</label>
                      <select
                        value={selectedSubgroupForMember}
                        onChange={(e) => handleSubgroupChangeForMember(e.target.value)}
                        className="w-full p-2 border rounded-md mt-1"
                        disabled={!selectedGroupForMember}
                      >
                        <option value="">Select a subgroup</option>
                        {subgroups.map((subgroup) => (
                          <option key={subgroup.id} value={subgroup.id}>
                            {subgroup.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gender</label>
                      <select
                        value={selectedGenderForMember}
                        onChange={(e) => setSelectedGenderForMember(e.target.value as 'Male' | 'Female')}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Member Name</label>
                      <Input
                        placeholder="Enter member name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={addNewMember}>
                    <UserPlus size={16} />
                    Add Member
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {members.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Gender: {member.gender}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Group: {groups.find(g => g.id === member.groupId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Subgroup: {subgroups.find(s => s.id === member.subgroupId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                        </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
