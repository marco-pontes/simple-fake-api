export interface InjectedHttpConfig {
    endpoints: Record<string, {
        baseUrl: string;
        headers?: Record<string, string>;
    }>;
}
export declare function setupSimpleFakeApiHttpRoutes(config: InjectedHttpConfig): Record<string, any>;
