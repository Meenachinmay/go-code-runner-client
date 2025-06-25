import type { ExecuteResponse } from "~/types";

export function TestResultDisplay({ results }: { results: ExecuteResponse }) {
    if (!results) {
        return null;
    }

    if (results.error) {
        return <p className="text-red-500">{results.error}</p>;
    }

    return (
        <div>
            {results.test_results?.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg mb-4 ${result.passed ? 'bg-green-800' : 'bg-red-800'}`}>
                    <h3 className="font-bold text-lg mb-2">Test Case #{result.test_case_id}</h3>
                    <p className={`font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                        {result.passed ? 'Passed' : 'Failed'}
                    </p>
                    <div className="mt-2 font-mono text-sm">
                        <p>Input: {result.input}</p>
                        <p>Expected Output: {result.expected_output}</p>
                        <p>Actual Output: {result.actual_output}</p>
                        {result.error && <p>Error: {result.error}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}