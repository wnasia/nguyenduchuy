
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";

interface LoginPromptProps {
  show: boolean;
}

const LoginPrompt = ({ show }: LoginPromptProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  if (!show) return null;

  return (
    <Card className="mt-8 bg-gradient-to-r from-primary/5 to-warm-100/30 border-primary/20">
      <CardContent className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">{t("submit.login_prompt_title")}</h3>
        <p className="text-gray-600 mb-4">
          {t("submit.login_prompt_desc")}
        </p>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate('/login')}
        >
          {t("submit.login_prompt_button")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginPrompt;
