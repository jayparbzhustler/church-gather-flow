import { useState, useEffect } from "react";
import { Download, Users, Calendar, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { churchDB, AttendanceRecord } from "@/lib/db";
import { exportAttendanceToCSV, generateAttendanceReport } from "@/lib/csv-export";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const [today, all] = await Promise.all([
        churchDB.getTodayAttendance(),
        churchDB.getAllAttendance()
      ]);
      setTodayAttendance(today);
      setAllAttendance(all);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today's Report</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}