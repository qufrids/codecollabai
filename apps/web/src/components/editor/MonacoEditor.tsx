"use client";

import { useCallback, useEffect, useRef } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import Editor, { loader } from "@monaco-editor/react";

// Ensure Monaco loads from the npm package
loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
  },
});

interface MonacoEditorProps {
  yDoc: Y.Doc;
  roomId: string;
}

export default function MonacoEditor({ yDoc }: MonacoEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      const yText = yDoc.getText("monaco");
      const model = editor.getModel();
      if (model) {
        bindingRef.current = new MonacoBinding(
          yText,
          model,
          new Set(),
          undefined
        );
      }

      // Set random user awareness info
      const awareness = (yDoc as any).awareness;
      if (awareness) {
        awareness.setLocalStateField("user", {
          name: `User-${Math.random().toString(36).slice(2, 6)}`,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });
      }
    },
    [yDoc]
  );

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  return (
    <Editor
      theme="vs-dark"
      language="javascript"
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
