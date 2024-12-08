import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import InfoTooltip from "@/components/ui/info-tooltip";
import LanguageSelector from "@/components/ui/markdown/plugins/language-selector";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  FileCode2,
  Highlighter,
  Italic,
  LucideIcon,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";

const LowPriority = 1;
export const CODE_LANGUAGE_MAP: Record<string, string> = {
  c: "C",
  clike: "C-like",
  cpp: "C++",
  css: "CSS",
  html: "HTML",
  java: "Java",
  js: "JavaScript",
  javascript: "JavaScript", // initial value of codeBlock is javascript and not js for some reason
  markdown: "Markdown",
  objc: "Objective-C",
  plain: "Plain Text",
  powershell: "PowerShell",
  py: "Python",
  rust: "Rust",
  sql: "SQL",
  swift: "Swift",
  typescript: "TypeScript",
  xml: "XML",
};

export default function ToolbarPlugin() {
  const { t } = useTranslation();
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    getDefaultCodeLanguage(),
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      const anchorNode = selection.anchor.getNode();
      const parentNode = anchorNode.getParent();

      if ($isCodeNode(parentNode)) {
        setSelectedLanguage(normalizeCodeLang(parentNode.getLanguage()));
        setIsCode(true);
      } else if ($isCodeNode(anchorNode)) {
        setSelectedLanguage(normalizeCodeLang(anchorNode.getLanguage()));

        setIsCode(true);
      } else {
        setIsCode(false);
      }
    }
  }, []);

  function normalizeCodeLang(lang: string | null | undefined): string {
    if (!lang) {
      return getDefaultCodeLanguage();
    }
    return lang;
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, $updateToolbar]);

  const formatButtons: {
    command: LexicalCommand<TextFormatType>;
    format: TextFormatType;
    isActive?: boolean;
    icon: LucideIcon;
    label: string;
  }[] = [
    {
      command: FORMAT_TEXT_COMMAND,
      format: "bold",
      icon: Bold,
      isActive: isBold,
      label: t("editor.text_toolbar.bold"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "italic",
      icon: Italic,
      isActive: isItalic,
      label: t("editor.text_toolbar.italic"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "underline",
      icon: Underline,
      isActive: isUnderline,
      label: t("editor.text_toolbar.underline"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "strikethrough",
      icon: Strikethrough,
      isActive: isStrikethrough,
      label: t("editor.text_toolbar.strikethrough"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "code",
      icon: Code,
      label: t("editor.text_toolbar.code"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "highlight",
      icon: Highlighter,
      label: t("editor.text_toolbar.highlight"),
    },
  ];

  const alignButtons: {
    command: LexicalCommand<ElementFormatType>;
    format: ElementFormatType;
    icon: LucideIcon;
    label: string;
  }[] = [
    {
      command: FORMAT_ELEMENT_COMMAND,
      format: "left",
      icon: AlignLeft,
      label: t("editor.text_toolbar.align_left"),
    },
    {
      command: FORMAT_ELEMENT_COMMAND,
      format: "center",
      icon: AlignCenter,
      label: t("editor.text_toolbar.align_center"),
    },
    {
      command: FORMAT_ELEMENT_COMMAND,
      format: "right",
      icon: AlignRight,
      label: t("editor.text_toolbar.align_right"),
    },
  ];

  const formatCodeBlock = () => {
    editor.update(() => {
      let selection = $getSelection();

      if (selection !== null && $isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        // back to normal
        if ($isCodeNode(anchorNode.getParent())) {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        } else if ($isCodeNode(anchorNode)) {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }

        if (selection.isCollapsed()) {
          $setBlocksType(selection, () =>
            $createCodeNode(getDefaultCodeLanguage()),
          );
        } else {
          const textContent = selection.getTextContent();
          const codeNode = $createCodeNode(getDefaultCodeLanguage());
          selection.insertNodes([codeNode]);
          selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertRawText(textContent);
          }
        }
      }
    });
  };

  return (
    <div
      className="mb-1 flex items-center justify-between rounded-t-lg p-1"
      ref={toolbarRef}
    >
      <div className="flex gap-2 ">
        <Button
          size={"sm"}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          disabled={!canUndo}
          variant={"ghost"}
          aria-label={t("editor.text_toolbar.undo")}
        >
          <Undo className="h-4" />
        </Button>
        <Button
          size={"sm"}
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          variant={"ghost"}
          aria-label={t("editor.text_toolbar.redo")}
        >
          <Redo className="h-4" />
        </Button>
        <Separator orientation={"vertical"} />
        <Button
          size={"sm"}
          onClick={() => {
            formatCodeBlock();
          }}
          variant={isCode ? "default" : "ghost"}
          aria-label={t("editor.text_toolbar.code_block")}
        >
          <FileCode2 className="h-4 w-4" />
        </Button>

        {isCode && (
          <>
            <div className={"w-32"}>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
              ></LanguageSelector>
            </div>
          </>
        )}

        {!isCode &&
          formatButtons.map(
            ({ command, format, icon: Icon, isActive, label }) => (
              <Button
                key={format}
                size={"sm"}
                onClick={() => {
                  editor.dispatchCommand(command, format);
                }}
                variant={isActive ? "default" : "ghost"}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ),
          )}
        <Separator orientation={"vertical"} />
        {alignButtons.map(({ command, format, icon: Icon, label }) => (
          <Button
            key={format}
            size={"sm"}
            onClick={() => {
              editor.dispatchCommand(command, format);
            }}
            variant={"ghost"}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <InfoTooltip size={15}>
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <th>{t("editor.text_toolbar.markdown_shortcuts.heading.label")}</th>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.heading.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.heading.example")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.bold.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.bold.example")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.italic.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.italic.example")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.blockquote.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.blockquote.example")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.ordered_list.label")}
              </td>
              <td className="py-2">
                {t(
                  "editor.text_toolbar.markdown_shortcuts.ordered_list.example",
                )}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t(
                  "editor.text_toolbar.markdown_shortcuts.unordered_list.label",
                )}
              </td>
              <td className="py-2">
                {t(
                  "editor.text_toolbar.markdown_shortcuts.unordered_list.example",
                )}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.divider.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.divider.example")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.inline_code.label")}
              </td>
              <td className="py-2">
                {t(
                  "editor.text_toolbar.markdown_shortcuts.inline_code.example",
                )}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.block_code.label")}
              </td>
              <td className="py-2">
                {t("editor.text_toolbar.markdown_shortcuts.block_code.example")}
              </td>
            </tr>
          </tbody>
        </table>
      </InfoTooltip>
    </div>
  );
}
