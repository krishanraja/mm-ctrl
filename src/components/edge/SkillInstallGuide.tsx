import { Terminal, Globe, Code2 } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface SkillInstallGuideProps {
  skillName: string;
  className?: string;
}

/**
 * Collapsible install guide. Three platforms covered: Claude Code (terminal,
 * recommended), Claude.ai web (Settings, Capabilities, Skills, Upload), and
 * Cursor (project .claude/skills directory). Same content as the
 * 03-install-guide.txt file inside the ZIP, but rendered for the preview UI
 * so the leader can read it before downloading.
 */
export function SkillInstallGuide({ skillName, className }: SkillInstallGuideProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-sm font-medium text-foreground">How to install this skill</h3>
      </div>
      <Accordion type="single" collapsible className="px-4">
        <AccordionItem value="claude-code" className="border-b-border">
          <AccordionTrigger className="text-sm font-medium">
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-accent" />
              Claude Code (Recommended)
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
              <li>Open your terminal.</li>
              <li>
                Run{" "}
                <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
                  unzip {skillName}.zip -d ~/.claude/skills/
                </code>
              </li>
              <li>The skill activates automatically in your next Claude Code session.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="claude-web" className="border-b-border">
          <AccordionTrigger className="text-sm font-medium">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              Claude.ai (Web or Desktop)
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
              <li>Go to claude.ai and sign in.</li>
              <li>Click your profile icon, then Settings.</li>
              <li>Go to Capabilities.</li>
              <li>
                Make sure <span className="font-medium">Code execution and file creation</span>{" "}
                is on.
              </li>
              <li>Scroll to Skills, then click Upload skill.</li>
              <li>Select this ZIP file.</li>
              <li>The skill activates automatically when your prompt matches its triggers.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cursor" className="border-b-0">
          <AccordionTrigger className="text-sm font-medium">
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent" />
              Cursor or other IDE
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
              <li>
                Unzip the file into your project's{" "}
                <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
                  .claude/skills/
                </code>{" "}
                directory.
              </li>
              <li>The skill is available in your next Cursor session.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
