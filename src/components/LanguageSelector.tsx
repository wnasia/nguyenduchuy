import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, Language } from "@/hooks/useI18n";

interface Props {
  variant?: "light" | "dark";
}

const LanguageSelector = ({ variant = "dark" }: Props) => {
  const { currentLanguage, changeLanguage } = useI18n();
  const isLight = variant === "light";

  const languages: { value: Language; label: string; flag: string; code: string }[] = [
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', code: 'VI' },
    { value: 'en', label: 'English', flag: '🇺🇸', code: 'EN' },
    { value: 'zh', label: '简体中文', flag: '🇨🇳', code: 'ZH' },
    { value: 'ja', label: '日本語', flag: '🇯🇵', code: 'JA' },
  ];

  const currentLang = languages.find((l) => l.value === currentLanguage) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Language: ${currentLang.label}`}
          className={`inline-flex items-center gap-1.5 h-8 px-2 rounded-full text-xs font-semibold transition-colors ${
            isLight
              ? "text-white/95 hover:text-white hover:bg-white/15 ring-1 ring-white/25"
              : "text-foreground hover:bg-muted ring-1 ring-border/60"
          }`}
        >
          <Globe className="h-3.5 w-3.5" strokeWidth={2.25} />
          <span className="leading-none tracking-wide">{currentLang.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-popover">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => changeLanguage(lang.value)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-base leading-none">{lang.flag}</span>
            <span className="flex-1 text-sm">{lang.label}</span>
            {lang.value === currentLanguage && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
