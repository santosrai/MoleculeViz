import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoleculeViewer } from "@/components/molecule-viewer";
import { ChatInterface } from "@/components/chat-interface";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search } from "lucide-react";

export default function Home() {
  const [moleculeName, setMoleculeName] = useState("water"); // Default to water
  const [currentMolecule, setCurrentMolecule] = useState<any>(null);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("GET", `/api/molecules/name/${name}`);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentMolecule(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Molecule not found",
        variant: "destructive",
      });
    },
  });

  // Load water molecule by default
  useEffect(() => {
    searchMutation.mutate("water");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (moleculeName) {
      searchMutation.mutate(moleculeName);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Molecular Visualization</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Molecule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={moleculeName}
              onChange={(e) => setMoleculeName(e.target.value)}
              placeholder="Search molecule..."
              className="flex-1"
            />
            <Button type="submit" disabled={searchMutation.isPending}>
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentMolecule && (
        <div className="grid grid-cols-[400px_1fr] gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Chat Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInterface moleculeId={currentMolecule.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <MoleculeViewer structure={currentMolecule.structure} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}