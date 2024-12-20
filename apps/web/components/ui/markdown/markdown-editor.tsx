import { memo, useMemo, useState } from "react";
import ToolbarPlugin from "@/components/ui/markdown/plugins/toolbar-plugin";
import { MarkdownEditorTheme } from "@/components/ui/markdown/theme";
import {
  CodeHighlightNode,
  CodeNode,
  registerCodeHighlighting,
} from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot, EditorState, LexicalEditor } from "lexical";

function onError(error: Error) {
  console.error(error);
}

const EDITOR_NODES = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  LinkNode,
  CodeNode,
  HorizontalRuleNode,
  CodeHighlightNode,
];

interface MarkdownEditorProps {
  children: string;
  onChangeMarkdown?: (markdown: string) => void;
}

const MarkdownEditor = memo(
  ({ children: initialMarkdown, onChangeMarkdown }: MarkdownEditorProps) => {
    const [isRawMarkdownMode, setIsRawMarkdownMode] = useState(false);

    const initialConfig: InitialConfigType = useMemo(
      () => ({
        namespace: "editor",
        onError,
        theme: MarkdownEditorTheme,
        nodes: EDITOR_NODES,
        editorState: (editor: LexicalEditor) => {
          registerCodeHighlighting(editor);
          $convertFromMarkdownString(initialMarkdown, TRANSFORMERS);
        },
      }),
      [initialMarkdown],
    );

    const handleOnChange = (editorState: EditorState) => {
      editorState.read(() => {
        let markdownString;
        if (isRawMarkdownMode) {
          // if raw markdown, the first child is a codeBlock
          markdownString = $getRoot()?.getFirstChild()?.getTextContent() ?? "";
        } else {
          markdownString = $convertToMarkdownString(TRANSFORMERS);
        }
        if (onChangeMarkdown) {
          onChangeMarkdown(markdownString);
        }
      });
    };

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className="flex h-full flex-col justify-stretch">
          <ToolbarPlugin
            isRawMarkdownMode={isRawMarkdownMode}
            setIsRawMarkdownMode={setIsRawMarkdownMode}
          />
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="prose h-full w-full min-w-full overflow-auto p-2 dark:prose-invert prose-p:m-0" />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <AutoFocusPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleOnChange} />
        <ListPlugin />
      </LexicalComposer>
    );
  },
);
// needed for linter because of memo
MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
