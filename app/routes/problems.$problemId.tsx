import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { Problem, TestCase, ExecuteResponse } from "~/types";
import { CodeEditor } from "~/components/CodeEditor";
import { TestResultDisplay } from "~/components/TestResultDisplay";

interface LoaderData {
    problem: Problem;
    testCases: TestCase[];
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
    try {
        const problemId = params.problemId;
        const response = await fetch(`http://localhost:8080/api/v1/problems/${problemId}`);
        const text = await response.text(); // Get the raw text first

        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            console.error("JSON parsing error:", error);
            console.error("Raw response:", text);
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }

        return json<LoaderData>({
            problem: data.problem,
            testCases: data.test_cases,
        });
    } catch (error) {
        console.error("Loader error:", error);
        // Return a default response with empty data
        return json<LoaderData>({
            problem: {
                id: parseInt(params.problemId || "0", 10),
                title: "Error loading problem",
                description: "There was an error loading this problem. Please try again later.",
                difficulty: "Unknown",
                created_at: "",
                updated_at: "",
            },
            testCases: [],
        });
    }
};

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const formData = await request.formData();
        const code = formData.get("code") as string;
        const problemId = formData.get("problemId") as string;

        const response = await fetch("http://localhost:8080/api/v1/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: "go",
                code,
                problem_id: parseInt(problemId, 10),
            }),
        });

        const text = await response.text(); // Get the raw text first

        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            console.error("JSON parsing error:", error);
            console.error("Raw response:", text);
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }

        return json<ExecuteResponse>(data);
    } catch (error) {
        console.error("Action error:", error);
        // Return a default error response
        return json<ExecuteResponse>({
            success: false,
            error: `An error occurred: ${error.message}`,
        });
    }
};


export default function ProblemPage() {
    const { problem, testCases } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Left side: Problem Description */}
            <div className="w-1/2 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
                <p className="text-lg text-gray-400 mb-6">{problem.difficulty}</p>
                <div
                    className="prose prose-invert"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                />
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Test Cases</h2>
                    {testCases.map((tc) => (
                        <div key={tc.id} className="bg-gray-800 p-4 rounded-lg mb-4">
                            <p className="font-mono text-sm">Input: {tc.input}</p>
                            <p className="font-mono text-sm">Expected Output: {tc.expected_output}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right side: Code Editor and Execution */}
            <div className="w-1/2 p-8 flex flex-col">
                <Form method="post" className="flex flex-col flex-grow">
                    <input type="hidden" name="problemId" value={problem.id} />
                    <CodeEditor name="code" />
                    <div className="mt-4">
                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded" disabled={isSubmitting}>
                            {isSubmitting ? "Running..." : "Run Code"}
                        </button>
                    </div>
                </Form>
                {actionData && (
                    <div className="mt-6">
                        <h2 className="text-2xl font-semibold mb-4">Results</h2>
                        <TestResultDisplay results={actionData} />
                    </div>
                )}
            </div>
        </div>
    );
}
