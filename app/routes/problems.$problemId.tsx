import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useState, useRef } from "react";
import type { Problem, TestCase, ExecuteResponse, JobStatusResponse } from "~/types";
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
            // @ts-expect-error - error is of unknown type from JSON.parse
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
            // @ts-expect-error - error is of unknown type from JSON.parse
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }

        // The backend now returns a job_id instead of immediate results
        // We'll return this to the client and let the polling mechanism handle it
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
    const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollError, setPollError] = useState<string | null>(null);
    const currentJobIdRef = useRef<string | null>(null);

    const isSubmitting = navigation.state === "submitting";

    // Reset job status when submitting a new code
    useEffect(() => {
        if (isSubmitting) {
            setJobStatus(null);
            setIsPolling(false);
            setPollError(null);
            currentJobIdRef.current = null;
        }
    }, [isSubmitting]);

    // Poll for job status when we have a job_id
    useEffect(() => {
        // If we have a new job_id from actionData, update our ref
        if (actionData?.job_id && actionData.job_id !== currentJobIdRef.current) {
            currentJobIdRef.current = actionData.job_id;
            setJobStatus(null); // Reset job status for the new job
        }

        // Don't start polling if we don't have a job_id or if the job is already completed/failed
        if (!currentJobIdRef.current || jobStatus?.status === "completed" || jobStatus?.status === "failed") {
            return;
        }

        const pollInterval = 1000; // Poll every 1 second
        setIsPolling(true);

        const pollJobStatus = async () => {
            try {
                // Use the ref for the job_id to ensure we're polling the correct job
                const response = await fetch(`http://localhost:8080/api/v1/execute/job/${currentJobIdRef.current}`);
                const data = await response.json();
                setJobStatus(data);

                if (data.status === "completed" || data.status === "failed") {
                    setIsPolling(false);
                }
            } catch (error) {
                console.error("Error polling job status:", error);
                setPollError("Failed to get job status. Please try again.");
                setIsPolling(false);
            }
        };

        // Initial poll
        pollJobStatus();

        // Set up interval for subsequent polls
        const intervalId = setInterval(pollJobStatus, pollInterval);

        // Clean up interval on unmount or when polling is done
        return () => clearInterval(intervalId);
    }, [actionData?.job_id]);

    // Determine what to display in the results section
    const getResultsDisplay = () => {
        if (pollError) {
            return <p className="text-red-500">{pollError}</p>;
        }

        if (isPolling) {
            return <p className="text-yellow-300">Processing your code... Please wait.</p>;
        }

        // If we have job status, show that (completed or failed)
        if (jobStatus) {
            return <TestResultDisplay results={jobStatus} />;
        }

        // If we have action data but no job status yet, show the initial submission response
        if (actionData) {
            return <TestResultDisplay results={actionData} />;
        }

        return null;
    };

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
            <div className="w-1/2 p-8 flex flex-col h-full overflow-hidden">
                <div className="flex flex-col h-full">

                    {/* Top section: Code Editor (fixed height) */}
                    <div className="h-[60%] mb-4">
                        <Form method="post" className="flex flex-col h-full">
                            <input type="hidden" name="problemId" value={problem.id} />

                            {/* Editor area */}
                            <div className="flex-1 overflow-hidden">
                                <CodeEditor name="code" />
                            </div>

                            <button
                                type="submit"
                                className={`mt-4 ${isSubmitting ? 'bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-2 px-4 rounded self-start flex items-center`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isSubmitting ? "Running..." : "Run Code"}
                            </button>
                        </Form>
                    </div>

                    {/* Bottom section: Test Results (scrollable) */}
                    <div className="h-[40%] overflow-y-auto">
                        {(actionData || isPolling || jobStatus || pollError) && (
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">Results</h2>
                                {getResultsDisplay()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
