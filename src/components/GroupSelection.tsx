import { useState, useEffect } from "react";
import { Search, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { churchDB, Group } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface GroupSelectionProps {
  selectedGender: 'Male' | 'Female';
  onGroupSelect: (group: Group) => void;
  onBack: () => void;
}

export default function GroupSelection({ selectedGender, onGroupSelect, onBack }: GroupSelectionProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const allGroups = await churchDB.getGroups();
      setGroups(allGroups);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewGroup = async () => {
    const groupName = prompt('Enter new group name:');
    if (groupName && groupName.trim()) {
      try {
        const newGroup = await churchDB.addGroup({ name: groupName.trim() });
        setGroups([...groups, newGroup]);
        toast({
          title: "Success",
          description: `Group "${groupName}" added successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add group",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Loading groups...</p>
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
              Select Group
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Gender: <span className={`font-semibold ${selectedGender === 'Male' ? 'text-male' : 'text-female'}`}>
                {selectedGender}
              </span>
            </p>
          </div>

          <Button
            variant="admin"
            size="lg"
            onClick={addNewGroup}
          >
            <Plus size={24} />
            Add Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-14 text-lg"
          />
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Button
              key={group.id}
              variant="kiosk"
              size="kiosk"
              onClick={() => onGroupSelect(group)}
              className="h-32"
            >
              {group.name}
            </Button>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              {searchTerm ? 'No groups found matching your search' : 'No groups available'}
            </p>
            <Button variant="admin" onClick={addNewGroup}>
              <Plus size={20} />
              Add First Group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}