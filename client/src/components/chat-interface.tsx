import { useState } from "react";
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
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const response = await askAboutMolecule(question, moleculeId);
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
        {messages.map((message, i) => (
          <Card key={i} className={`mb-4 p-4 ${message.role === "user" ? "bg-primary/10" : "bg-secondary/10"}`}>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 mt-1" />
              <p>{message.content}</p>
            </div>
          </Card>
        ))}
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this molecule..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
