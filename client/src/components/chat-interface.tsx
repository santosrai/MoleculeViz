
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { askAboutMolecule } from "@/lib/openai";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatInterfaceProps {
  moleculeId: number;
}

export function ChatInterface({ moleculeId }: ChatInterfaceProps) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery({
    queryKey: ["/api/chat", moleculeId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/chat/${moleculeId}`);
        const data = await response.json();
        console.log("Fetched chat history:", data); // Debug log
        return data || [];
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }
    },
    enabled: !!moleculeId,
  });

  const chatMutation = useMutation({
    mutationFn: async ({ question, moleculeId }: { question: string; moleculeId: number }) => {
      const response = await askAboutMolecule(question, moleculeId);
      console.log("Chat response:", response); // Debug log
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", moleculeId] });
    },
    onError: (error) => {
      console.error("Chat error:", error); // Debug log
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
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-lg">
      <div className="flex items-center p-4 border-b border-gray-800">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="/avatar.png" />
          <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
        </Avatar>
        <h3 className="text-white text-sm font-medium">Molecule Assistant</h3>
        <p className="ml-auto text-xs text-gray-400">This is AI and not a real person. Treat everything it says as fiction</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading chat history...</p>
        ) : chatHistory.length === 0 && !chatMutation.isPending ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No chat history yet. Ask a question to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((chat: any) => (
              <div key={chat.id} className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white p-3 rounded-lg rounded-br-none max-w-[80%] ml-auto">
                    {chat.question}
                  </div>
                </div>
                <div className="flex items-start">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-800 text-white p-3 rounded-lg rounded-tl-none max-w-[80%]">
                    {chat.answer}
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-start">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
                </Avatar>
                <div className="bg-gray-800 text-white p-3 rounded-lg rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-850">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this molecule..."
            disabled={chatMutation.isPending}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button type="submit" disabled={chatMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
