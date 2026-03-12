export interface TokenData {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    obtained_at?: number;
    pending_state?: string;
}
export declare function loadTokens(): TokenData;
export declare function saveTokens(t: TokenData): void;
//# sourceMappingURL=tokenManager.d.ts.map