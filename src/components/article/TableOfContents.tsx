import { useState, useEffect } from "react";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentHtml: string;
}

const TableOfContents = ({ contentHtml }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");
    const headingElements = doc.querySelectorAll("h1, h2, h3, h4");
    
    const extractedHeadings: Heading[] = [];
    headingElements.forEach((el, index) => {
      const text = el.textContent?.trim() || "";
      if (text) {
        const id = `heading-${index}`;
        extractedHeadings.push({
          id,
          text,
          level: parseInt(el.tagName[1]),
        });
      }
    });
    
    setHeadings(extractedHeadings);
  }, [contentHtml]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM after render
    const articleContent = document.querySelector(".prose");
    if (articleContent) {
      const domHeadings = articleContent.querySelectorAll("h1, h2, h3, h4");
      domHeadings.forEach((el, index) => {
        el.id = `heading-${index}`;
      });
    }

    // Intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    const domHeadings = document.querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4");
    domHeadings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <List className="h-5 w-5 text-primary" />
        Mục lục
      </h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleClick(heading.id)}
            className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
              heading.level === 1 ? "pl-2" :
              heading.level === 2 ? "pl-4" :
              heading.level === 3 ? "pl-6" : "pl-8"
            } ${
              activeId === heading.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TableOfContents;
