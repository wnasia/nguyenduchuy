
import SubmitForm from "@/components/submit/SubmitForm";
import { useI18n } from "@/hooks/useI18n";
import { useEffect } from "react";

const Submit = () => {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t("meta.submit_title");
  }, [t]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <SubmitForm />
      </div>
    </div>
  );
};

export default Submit;
