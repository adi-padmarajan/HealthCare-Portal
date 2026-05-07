import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Physician } from "../data/mockData";

interface PhysicianCardProps {
  physician: Physician;
  onSelect: () => void;
}

export function PhysicianCard({ physician, onSelect }: PhysicianCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
      <CardHeader className="text-center">
        <div className="text-6xl mb-3">{physician.avatar}</div>
        <CardTitle>{physician.name}</CardTitle>
        <CardDescription className="text-[#2563eb]">{physician.specialty}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <p className="text-sm text-muted-foreground">{physician.bio}</p>
        <p className="text-sm">
          <span className="font-medium">Experience:</span> {physician.yearsOfExperience} years
        </p>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button onClick={onSelect} className="w-full">
          Select Physician
        </Button>
      </CardFooter>
    </Card>
  );
}
