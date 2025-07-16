import type { ExecuteResponse, JobStatusResponse } from "~/types";

export function TestResultDisplay({ results }: { results: ExecuteResponse | JobStatusResponse }) {
    if (!results) {
        return null;
    }

    // Handle error cases
    if (results.error) {
        return <p className="text-red-500">{results.error}</p>;
    }

    // Handle job status messages
    if ('status' in results && results.status !== 'completed') {
        return (
            <div className="p-4 rounded-lg mb-4 bg-yellow-800">
                <h3 className="font-bold text-lg mb-2">Job Status: {results.status}</h3>
                {results.message && <p>{results.message}</p>}
                <p className="text-yellow-300">Please wait while your code is being processed...</p>
            </div>
        );
    }

    // Handle job submission response without test results
    if ('job_id' in results && !results.test_results) {
        return (
            <div className="p-4 rounded-lg mb-4 bg-blue-800">
                <h3 className="font-bold text-lg mb-2">Job Submitted</h3>
                <p>Job ID: {results.job_id}</p>
                {results.message && <p>{results.message}</p>}
                <p className="text-blue-300">Your code has been submitted for execution.</p>
            </div>
        );
    }

    // Display test results if available
    if (results.test_results && results.test_results.length > 0) {
        return (
            <div>
                {results.test_results.map((result, index) => (
                    <div key={index} className={`p-4 rounded-lg mb-4 ${result.passed ? 'bg-green-800' : 'bg-red-800'}`}>
                        <h3 className="font-bold text-lg mb-2">Test Case #{result.test_case_id}</h3>
                        <p className={`font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                        </p>
                        <div className="mt-2 font-mono text-sm">
                            {result.input && <p>Input: {result.input}</p>}
                            {result.expected_output && <p>Expected Output: {result.expected_output}</p>}
                            <p>Actual Output: {result.actual_output}</p>
                            {result.error && <p>Error: {result.error}</p>}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Fallback for empty or unexpected response
    return (
        <div className="p-4 rounded-lg mb-4 bg-gray-800">
            <p>No results available.</p>
        </div>
    );
}
