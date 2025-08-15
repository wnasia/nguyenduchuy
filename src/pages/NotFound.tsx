
import { useLocation } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    document.title = t("errors.404_title") + " - " + t("brand.name");
  }, [t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t("errors.404_title")}</h1>
        <p className="text-xl text-gray-600 mb-4">{t("errors.404_subtitle")}</p>
        <p className="text-gray-500 mb-6">
          {t("errors.404_description")} "{location.pathname}".
        </p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          {t("errors.404_return")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
