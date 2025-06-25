import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";

interface Props {
  name: string;
  defaultValue?: string;
}

export function CodeEditor({ name, defaultValue = "" }: Props) {
  const [code, setCode] = useState(defaultValue);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  /* keep the hidden field in sync so Remix <Form> still works */
  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = code;
  }, [code]);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden rounded-lg border border-gray-700"> {/* ← add h-full */}
      <CodeMirror
        value={code}
        onChange={setCode}
        height="100%"
        style={{ flex: 1 }}
        theme="dark"
        extensions={[go()]}
        basicSetup={{ lineNumbers: true, foldGutter: true }}
      />

      {/* hidden field submitted with the form */}
      <textarea ref={hiddenRef} name={name} hidden readOnly />
    </div>
  );
}