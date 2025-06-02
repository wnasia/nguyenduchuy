
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface LoginPromptProps {
  show: boolean;
}

const LoginPrompt = ({ show }: LoginPromptProps) => {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <Card className="mt-8 bg-gradient-to-r from-primary/5 to-warm-100/30 border-primary/20">
      <CardContent className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Want to manage your stories?</h3>
        <p className="text-gray-600 mb-4">
          Create an account to edit your stories, track views, and connect with other storytellers.
        </p>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate('/login')}
        >
          Sign Up or Log In
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginPrompt;
