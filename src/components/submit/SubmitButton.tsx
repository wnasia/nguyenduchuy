
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  const { t } = useI18n();
  
  return (
    <div className="pt-6">
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? t("submit.submitting") : t("submit.submit_button")}
      </Button>
      <p className="text-center text-sm text-gray-500 mt-4">
        {t("submit.submit_disclaimer")}
      </p>
    </div>
  );
};

export default SubmitButton;
