import SubmitForm from "@/components/submit/SubmitForm";
import { useI18n } from "@/hooks/useI18n";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearchParams } from "react-router-dom";

const Submit = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    document.title = t("meta.submit_title");
  }, [t]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <SubmitForm editId={editId || undefined} />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Submit;
