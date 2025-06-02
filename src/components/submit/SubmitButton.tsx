
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  return (
    <div className="pt-6">
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Share My Story"}
      </Button>
      <p className="text-center text-sm text-gray-500 mt-4">
        By submitting your story, you agree to share it with our community. 
        We'll review it before publishing to ensure it meets our community guidelines.
      </p>
    </div>
  );
};

export default SubmitButton;
