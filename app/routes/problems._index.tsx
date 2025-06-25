import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { Problem } from "~/types";

interface LoaderData {
    problems: Problem[];
}

export const loader = async () => {
    try {
        const response = await fetch("http://localhost:8080/api/v1/problems");
        const text = await response.text(); // Get the raw text first

        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            console.error("JSON parsing error:", error);
            console.error("Raw response:", text);
            // @ts-ignore
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }

        return json<LoaderData>({ problems: data.problems });
    } catch (error) {
        console.error("Loader error:", error);
        return json<LoaderData>({ problems: [] });
    }
};

export default function ProblemsIndex() {
    const { problems } = useLoaderData<typeof loader>();

    return (
        <div className="p-8 bg-gray-900 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Problems</h1>
            {problems.length === 0 ? (
                <p className="text-yellow-400">No problems available. There might be an issue with the API.</p>
            ) : (
                <ul>
                    {problems.map((problem) => (
                        <li key={problem.id} className="mb-2">
                            <Link to={`/problems/${problem.id}`} className="text-lg text-blue-400 hover:underline">
                                {problem.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}