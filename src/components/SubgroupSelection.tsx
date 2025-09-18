import { useState, useEffect } from "react";
import { Search, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { churchDB, Group, Subgroup } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface SubgroupSelectionProps {
  selectedGender: 'Male' | 'Female';
  selectedGroup: Group;
  onSubgroupSelect: (subgroup: Subgroup) => void;
  onBack: () => void;
}

export default function SubgroupSelection({ 
  selectedGender, 
  selectedGroup, 
  onSubgroupSelect, 
  onBack 
}: SubgroupSelectionProps) {
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubgroups();
  }, [selectedGroup]);

  const loadSubgroups = async () => {
    try {
      const groupSubgroups = await churchDB.getSubgroupsByGroup(selectedGroup.id);
      setSubgroups(groupSubgroups);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subgroups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubgroups = subgroups.filter(subgroup =>
    subgroup.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewSubgroup = async () => {
    const subgroupName = prompt('Enter new subgroup name:');
    if (subgroupName && subgroupName.trim()) {
      try {
        const newSubgroup = await churchDB.addSubgroup({ 
          name: subgroupName.trim(),
          groupId: selectedGroup.id
        });
        setSubgroups([...subgroups, newSubgroup]);
        toast({
          title: "Success",
          description: `Subgroup "${subgroupName}" added successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add subgroup",
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
          <p className="text-xl text-muted-foreground">Loading subgroups...</p>
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
              Select Subgroup
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              <span className={`font-semibold ${selectedGender === 'Male' ? 'text-male' : 'text-female'}`}>
                {selectedGender}
              </span>
              {' → '}
              <span className="font-semibold text-primary">
                {selectedGroup.name}
              </span>
            </p>
          </div>

          <Button
            variant="admin"
            size="lg"
            onClick={addNewSubgroup}
          >
            <Plus size={24} />
            Add Subgroup
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search subgroups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-14 text-lg"
          />
        </div>

        {/* Subgroups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubgroups.map((subgroup) => (
            <Button
              key={subgroup.id}
              variant="kiosk"
              size="kiosk"
              onClick={() => onSubgroupSelect(subgroup)}
              className="h-32"
            >
              {subgroup.name}
            </Button>
          ))}
        </div>

        {filteredSubgroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              {searchTerm ? 'No subgroups found matching your search' : 'No subgroups available'}
            </p>
            <Button variant="admin" onClick={addNewSubgroup}>
              <Plus size={20} />
              Add First Subgroup
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}