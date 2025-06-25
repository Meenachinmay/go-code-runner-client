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
    <div className="flex flex-col flex-1 overflow-hidden rounded-lg border border-gray-700">
      <CodeMirror
        value={code}
        onChange={setCode}
        /* let it fill the wrapper */
        height="100%"
        style={{ flex: 1 }}      // <─── important
        theme="dark"
        extensions={[go()]}
        basicSetup={{ lineNumbers: true, foldGutter: true }}
      />

      {/* hidden field submitted with the form */}
      <textarea ref={hiddenRef} name={name} hidden readOnly />
    </div>
  );
}