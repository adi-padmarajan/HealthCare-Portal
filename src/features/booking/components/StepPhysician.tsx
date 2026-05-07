import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhysicianCard } from "@/features/physicians";
import { Search } from "lucide-react";
import type { Physician } from "@/types";

interface StepPhysicianProps {
  isError?: boolean;
  isLoading?: boolean;
  onSelect: (physicianId: string) => void;
  onRetry?: () => void;
  physicians: Physician[];
}

export function StepPhysician({
  isError = false,
  isLoading = false,
  onRetry,
  onSelect,
  physicians,
}: StepPhysicianProps) {
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const specialties = ["all", ...new Set(physicians.map((p) => p.specialty))];

  const filteredPhysicians = physicians.filter((physician) => {
    const matchesSearch = physician.name.toLowerCase().includes(search.toLowerCase()) || physician.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || physician.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Choose Your Physician</h2>
        <p className="text-muted-foreground">Select a physician that best matches your healthcare needs</p>
      </div>

      {isLoading && <LoadingState framed={false} message="Loading physicians..." />}

      {isError && (
        <ErrorState
          framed={false}
          title="Unable to load physicians"
          message="Please try again. Physician availability may be temporarily unavailable."
          onRetry={onRetry}
        />
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or specialty" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.slice(1).map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!isLoading && !isError && filteredPhysicians.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredPhysicians.map((physician) => (
            <PhysicianCard key={physician.id} physician={physician} onSelect={() => onSelect(physician.id)} />
          ))}
        </div>
      )}

      {!isLoading && !isError && filteredPhysicians.length === 0 && (
        <EmptyState framed={false} title="No physicians found" description="Adjust your search or specialty filter." />
      )}
    </div>
  );
}
