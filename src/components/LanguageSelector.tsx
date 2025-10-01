
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, Language } from "@/hooks/useI18n";

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, t } = useI18n();

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'zh', label: '简体中文', flag: '🇨🇳' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  const currentLang = languages.find(lang => lang.value === currentLanguage);

  return (
    <Select value={currentLanguage} onValueChange={changeLanguage}>
      <SelectTrigger className="w-auto border-0 bg-transparent hover:bg-gray-100 focus:ring-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentLang?.flag}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
