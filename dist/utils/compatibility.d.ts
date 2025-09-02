/** Determine if we are running in a real Node.js runtime (not a bundled browser env). */
export declare function isNodeRuntime(): boolean;
/** Resolve the base directory to locate consumer project files (INIT_CWD preferred). */
export declare function resolveBaseDir(): string;
/**
 * Try to register ts-node so that requiring .ts/.cts files works synchronously.
 * Prefers programmatic tsnode.register({ transpileOnly: true }) and falls back to register modules.
 * It never throws; best-effort only.
 */
export declare function tryRegisterTsNode(req?: NodeRequire): void;
/** Require a module path synchronously and return default export if present; supports TS via ts-node. */
export declare function syncRequireModule(filePath: string, req?: NodeRequire): any;
