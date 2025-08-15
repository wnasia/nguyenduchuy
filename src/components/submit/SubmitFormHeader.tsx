
import { Heart } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";

const SubmitFormHeader = () => {
  const { t } = useI18n();

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("submit.title")}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t("submit.subtitle")}
        </p>
      </div>
      
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-serif flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          {t("submit.form_title")}
        </CardTitle>
        <CardDescription>
          {t("submit.form_subtitle")}
        </CardDescription>
      </CardHeader>
    </>
  );
};

export default SubmitFormHeader;
