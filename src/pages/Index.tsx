import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { churchDB, Group, Subgroup, AttendanceRecord } from "@/lib/db";
import WelcomeScreen from "@/components/WelcomeScreen";
import GroupSelection from "@/components/GroupSelection";
import SubgroupSelection from "@/components/SubgroupSelection";
import MemberList from "@/components/MemberList";
import AdminDashboard from "@/components/AdminDashboard";
import { useToast } from "@/hooks/use-toast";

type Screen = 'welcome' | 'groups' | 'subgroups' | 'members' | 'admin';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedGender, setSelectedGender] = useState<'Male' | 'Female' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<Subgroup | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await churchDB.init();
      await churchDB.initializeDefaultData();
      setDbInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      toast({
        title: "Database Error",
        description: "Failed to initialize local database. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleGenderSelect = (gender: 'Male' | 'Female') => {
    setSelectedGender(gender);
    setCurrentScreen('groups');
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setCurrentScreen('subgroups');
  };

  const handleSubgroupSelect = (subgroup: Subgroup) => {
    setSelectedSubgroup(subgroup);
    setCurrentScreen('members');
  };

  const handleCheckInComplete = (attendance: AttendanceRecord) => {
    // Reset to welcome screen after successful check-in
    setTimeout(() => {
      resetToWelcome();
    }, 2000);
  };

  const resetToWelcome = () => {
    setCurrentScreen('welcome');
    setSelectedGender(null);
    setSelectedGroup(null);
    setSelectedSubgroup(null);
  };

  const goBackOneStep = () => {
    switch (currentScreen) {
      case 'groups':
        setCurrentScreen('welcome');
        setSelectedGender(null);
        break;
      case 'subgroups':
        setCurrentScreen('groups');
        setSelectedGroup(null);
        break;
      case 'members':
        setCurrentScreen('subgroups');
        setSelectedSubgroup(null);
        break;
      case 'admin':
        setCurrentScreen('welcome');
        break;
      default:
        setCurrentScreen('welcome');
    }
  };

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Initializing Church Kiosk</h2>
          <p className="text-lg text-muted-foreground">Setting up offline database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Admin Button - Always visible */}
      {currentScreen !== 'admin' && (
        <Button
          variant="admin"
          size="sm"
          onClick={() => setCurrentScreen('admin')}
          className="fixed top-4 right-4 z-50"
        >
          <Settings size={16} />
          Admin
        </Button>
      )}

      {/* Screen Components */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen onGenderSelect={handleGenderSelect} />
      )}

      {currentScreen === 'groups' && selectedGender && (
        <GroupSelection
          selectedGender={selectedGender}
          onGroupSelect={handleGroupSelect}
          onBack={goBackOneStep}
        />
      )}

      {currentScreen === 'subgroups' && selectedGender && selectedGroup && (
        <SubgroupSelection
          selectedGender={selectedGender}
          selectedGroup={selectedGroup}
          onSubgroupSelect={handleSubgroupSelect}
          onBack={goBackOneStep}
        />
      )}

      {currentScreen === 'members' && selectedGender && selectedGroup && selectedSubgroup && (
        <MemberList
          selectedGender={selectedGender}
          selectedGroup={selectedGroup}
          selectedSubgroup={selectedSubgroup}
          onBack={goBackOneStep}
          onCheckInComplete={handleCheckInComplete}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminDashboard onBack={goBackOneStep} />
      )}
    </div>
  );
};

export default Index;