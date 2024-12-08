import React, { memo, useCallback, useMemo } from "react";
import ToolbarPlugin from "@/components/ui/markdown/plugins/toolbar-plugin";
import { UpdateMarkdownPlugin } from "@/components/ui/markdown/plugins/update-markdown-editor-plugin";
import { MarkdownEditorTheme } from "@/components/ui/markdown/theme/theme";
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
  CHECK_LIST,
  TRANSFORMERS,
} from "@lexical/markdown";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
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
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { EditorState, LexicalEditor } from "lexical";

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
  CodeHighlightNode,
  HorizontalRuleNode,
];

interface MarkdownEditorProps {
  children: string;
  onChangeMarkdown?: (markdown: string) => void;
  readonly?: boolean;
}

const transformers = [...TRANSFORMERS, CHECK_LIST];
const MarkdownEditor = memo(
  ({
    children: initialMarkdown,
    onChangeMarkdown,
    readonly = false,
  }: MarkdownEditorProps) => {
    const initialConfig: InitialConfigType = useMemo(
      () => ({
        namespace: "editor",
        onError,
        editable: !readonly,
        theme: MarkdownEditorTheme,
        nodes: EDITOR_NODES,
        editorState: (editor: LexicalEditor) => {
          $convertFromMarkdownString(initialMarkdown, transformers);
          registerCodeHighlighting(editor);
        },
      }),
      [readonly, initialMarkdown],
    );

    const handleOnChange = useCallback(
      (editorState: EditorState) => {
        editorState.read(() => {
          const markdownString = $convertToMarkdownString(transformers);
          if (onChangeMarkdown) onChangeMarkdown(markdownString);
        });
      },
      [onChangeMarkdown],
    );

    return (
      <LexicalComposer initialConfig={initialConfig}>
        {readonly ? (
          <PlainTextPlugin
            contentEditable={
              <ContentEditable className="h-full w-full content-center" />
            }
            ErrorBoundary={LexicalErrorBoundary}
          ></PlainTextPlugin>
        ) : (
          <>
            <div className="flex h-full flex-col justify-stretch">
              <ToolbarPlugin></ToolbarPlugin>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="h-full overflow-auto" />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </>
        )}
        {!readonly && (
          <>
            <HistoryPlugin />
            <TabIndentationPlugin />
            <OnChangePlugin onChange={handleOnChange} />
            <MarkdownShortcutPlugin transformers={transformers} />
            <ListPlugin />
            <CheckListPlugin />
          </>
        )}
        {readonly && <UpdateMarkdownPlugin markdown={initialMarkdown} />}
      </LexicalComposer>
    );
  },
);
// needed for linter because of memo
MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
