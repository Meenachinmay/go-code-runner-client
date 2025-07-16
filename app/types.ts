export interface Problem {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    created_at: string;
    updated_at: string;
}

export interface TestCase {
    id: number;
    problem_id: number;
    input: string;
    expected_output: string;
    is_hidden: boolean;
    created_at: string;
    updated_at: string;
}

export interface TestResult {
    test_case_id: number;
    input?: string;
    expected_output?: string;
    actual_output: string;
    error?: string;
    passed: boolean;
}

export interface ExecutionResults {
    success: boolean;
    test_results: TestResult[];
}

export interface JobSubmissionResponse {
    success: boolean;
    job_id: string;
    message: string;
    error?: string;
}

export interface JobStatusResponse {
    job_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    success: boolean;
    test_results?: TestResult[];
    error?: string;
}

export interface ExecuteResponse {
    success: boolean;
    output?: string;
    error?: string;
    test_results?: TestResult[];
    job_id?: string;
    message?: string;
    status?: "pending" | "processing" | "completed" | "failed";
}
