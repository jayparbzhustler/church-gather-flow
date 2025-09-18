import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onGenderSelect: (gender: 'Male' | 'Female') => void;
}

export default function WelcomeScreen({ onGenderSelect }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Users size={64} className="text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
          Welcome to Service
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          Please select your gender to check in
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
        <Button
          variant="male"
          size="kiosk"
          onClick={() => onGenderSelect('Male')}
          className="flex-1"
        >
          <Users size={32} />
          Male
        </Button>
        
        <Button
          variant="female"
          size="kiosk"
          onClick={() => onGenderSelect('Female')}
          className="flex-1"
        >
          <Users size={32} />
          Female
        </Button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Church Attendance System - Offline Ready
        </p>
      </div>
    </div>
  );
}