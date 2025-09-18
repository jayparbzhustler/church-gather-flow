import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Member, AttendanceRecord, Subgroup } from "@/lib/db";

interface CheckInConfirmationProps {
  member: Member;
  attendance: AttendanceRecord;
  subgroup: Subgroup;
  onCheckInAnother: () => void;
  onBackToHome: () => void;
}

export default function CheckInConfirmation({
  member,
  subgroup,
  attendance,
  onCheckInAnother,
  onBackToHome,
}: CheckInConfirmationProps) {
  const checkInTime = new Date(attendance.checkInTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-card p-8 rounded-xl shadow-lg">
        <div className="flex justify-center">
            <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-14 w-14 text-white" />
            </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mt-4">Checked In!</h1>
        <p className="text-muted-foreground text-lg mt-4">
          {member.name} ({subgroup.name}) has been successfully checked in.
        </p>
        <p className="text-muted-foreground text-lg mt-2">
          Time: {checkInTime}
        </p>
        <div className="mt-8 space-y-4">
          <Button
            onClick={onBackToHome}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
