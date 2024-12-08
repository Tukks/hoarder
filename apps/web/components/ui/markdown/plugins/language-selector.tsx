import { CODE_LANGUAGE_MAP } from "@/components/ui/markdown/plugins/toolbar-plugin";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";

const LanguageSelector = ({
  selectedLanguage,
}: {
  selectedLanguage: string;
}) => {
  const [editor] = useLexicalComposerContext();

  const languageOptions = Object.entries(CODE_LANGUAGE_MAP);

  const handleLanguageChange = (language: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection && $isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const parentNode = anchorNode.getParent();
        if ($isCodeNode(parentNode)) {
          parentNode.setLanguage(language);
        } else if ($isCodeNode(anchorNode)) {
          anchorNode.setLanguage(language);
        }
      }
    });
  };

  return (
    <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
      <SelectTrigger>
        <SelectValue placeholder={selectedLanguage} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {languageOptions.map(([key, value]) => (
            <SelectItem key={key} value={key}>
              {value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
