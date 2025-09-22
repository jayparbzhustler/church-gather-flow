import { useState, useEffect } from "react";
import { Search, ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Group, Subgroup, Member } from "@/lib/db";
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
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMemberResults, setShowMemberResults] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      const [subgroupsResponse, membersResponse] = await Promise.all([
        fetch(`/.netlify/functions/get-subgroups?groupId=${selectedGroup.id}`),
        fetch('/.netlify/functions/get-members')
      ]);

      if (!subgroupsResponse.ok) throw new Error('Failed to fetch subgroups');
      if (!membersResponse.ok) throw new Error('Failed to fetch members');

      const groupSubgroups: Subgroup[] = await subgroupsResponse.json();
      const allMembers: Member[] = await membersResponse.json();
      
      // Sort subgroups by name
      const sortedSubgroups = groupSubgroups.sort((a, b) => a.name.localeCompare(b.name));
      setSubgroups(sortedSubgroups);
      setAllMembers(allMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubgroups = subgroups.filter(subgroup =>
    subgroup.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter members by search term and selected gender
  const filteredMembers = allMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    member.gender === selectedGender &&
    member.groupId === selectedGroup.id
  );

  const hasSearchResults = searchTerm.length > 0;
  const hasMemberResults = filteredMembers.length > 0;
  const hasSubgroupResults = filteredSubgroups.length > 0;


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

        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search subgroups or members..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowMemberResults(e.target.value.length > 0);
            }}
            className="pl-10 h-14 text-lg"
          />
        </div>

        {/* Search Results */}
        {showMemberResults && hasMemberResults && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Users className="mr-2" size={20} />
              Member Results ({filteredMembers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 bg-card">
                  <h4 className="font-semibold text-lg mb-2">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Subgroup: {subgroups.find(s => s.id === member.subgroupId)?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click subgroup to navigate
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {!hasSearchResults && filteredSubgroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No subgroups available
            </p>
          </div>
        )}

        {hasSearchResults && !hasSubgroupResults && !hasMemberResults && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No subgroups or members found matching your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
