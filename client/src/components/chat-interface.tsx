import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { askAboutMolecule } from "@/lib/openai";
import { MessageCircle, Send } from "lucide-react";

interface ChatInterfaceProps {
  moleculeId: number;
}

export function ChatInterface({ moleculeId }: ChatInterfaceProps) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory = [] } = useQuery({
    queryKey: ["/api/chat", moleculeId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat/${moleculeId}`);
      return response.json();
    },
    enabled: !!moleculeId,
  });

  const chatMutation = useMutation({
    mutationFn: async ({ question, moleculeId }: { question: string; moleculeId: number }) => {
      const response = await askAboutMolecule(question, moleculeId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", moleculeId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    chatMutation.mutate({ question, moleculeId });
    setQuestion("");
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
        {chatHistory.map((chat: any) => (
          <Card key={chat.id} className="mb-4 p-4">
            <div className="flex items-start gap-2 mb-2">
              <MessageCircle className="w-4 h-4 mt-1 text-primary" />
              <p className="font-medium">Question:</p>
            </div>
            <p className="ml-6 mb-4">{chat.question}</p>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 mt-1 text-secondary" />
              <p className="font-medium">Answer:</p>
            </div>
            <p className="ml-6">{chat.answer}</p>
          </Card>
        ))}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this molecule..."
          disabled={chatMutation.isPending}
        />
        <Button type="submit" disabled={chatMutation.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}