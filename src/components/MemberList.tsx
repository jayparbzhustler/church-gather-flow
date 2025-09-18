import { useState, useEffect } from "react";
import { Search, ArrowLeft, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { churchDB, Group, Subgroup, Member, AttendanceRecord } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface MemberListProps {
  selectedGender: 'Male' | 'Female';
  selectedGroup: Group;
  selectedSubgroup: Subgroup;
  onBack: () => void;
  onCheckInComplete: (attendance: AttendanceRecord) => void;
}

export default function MemberList({ 
  selectedGender, 
  selectedGroup, 
  selectedSubgroup, 
  onBack,
  onCheckInComplete
}: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, [selectedSubgroup]);

  const loadMembers = async () => {
    try {
      const subgroupMembers = await churchDB.getMembersBySubgroup(selectedSubgroup.id);
      // Filter by selected gender
      const filteredMembers = subgroupMembers.filter(member => member.gender === selectedGender);
      setMembers(filteredMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewMember = async () => {
    const memberName = prompt('Enter new member name:');
    if (memberName && memberName.trim()) {
      try {
        const newMember = await churchDB.addMember({ 
          name: memberName.trim(),
          gender: selectedGender,
          groupId: selectedGroup.id,
          subgroupId: selectedSubgroup.id
        });
        setMembers([...members, newMember]);
        toast({
          title: "Success",
          description: `Member "${memberName}" added successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add member",
          variant: "destructive",
        });
      }
    }
  };

  const handleCheckIn = async (member: Member) => {
    setCheckingIn(member.id);
    try {
      const attendance = await churchDB.markAttendance(member.id);
      onCheckInComplete(attendance);
      
      toast({
        title: "✅ Checked In!",
        description: `${member.name} has been checked in successfully`,
        variant: "default",
      });

      // Auto-redirect back to welcome after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in member",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
          >
            <ArrowLeft size={24} />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Select Member
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              <span className={`font-semibold ${selectedGender === 'Male' ? 'text-male' : 'text-female'}`}>
                {selectedGender}
              </span>
              {' → '}
              <span className="font-semibold text-primary">
                {selectedGroup.name}
              </span>
              {' → '}
              <span className="font-semibold text-accent-foreground">
                {selectedSubgroup.name}
              </span>
            </p>
          </div>

          <Button
            variant="admin"
            size="lg"
            onClick={addNewMember}
          >
            <Plus size={24} />
            Add Member
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-14 text-lg"
          />
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Button
              key={member.id}
              variant={checkingIn === member.id ? "success" : "kiosk"}
              size="kiosk"
              onClick={() => handleCheckIn(member)}
              disabled={checkingIn === member.id}
              className="h-32 relative"
            >
              {checkingIn === member.id ? (
                <>
                  <CheckCircle size={32} className="animate-pulse" />
                  Checking In...
                </>
              ) : (
                member.name
              )}
            </Button>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              {searchTerm ? 'No members found matching your search' : 'No members available'}
            </p>
            <Button variant="admin" onClick={addNewMember}>
              <Plus size={20} />
              Add First Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}