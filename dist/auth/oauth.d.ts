export declare function buildAuthUrl(): string;
export declare function waitForCallback(timeoutMs?: number): Promise<{
    code: string;
    state: string;
}>;
export declare function exchangeCode(code: string): Promise<void>;
//# sourceMappingURL=oauth.d.ts.map