import type { SimpleFakeApiConfig } from '../types.js';
export declare function readPackageJson(customPackageJsonPath?: string): any | undefined;
export declare function readSimpleFakeApiConfig(customPackageJsonPath?: string): SimpleFakeApiConfig | undefined;
import type { PackageJsonHttpSection } from '../types.js';
export declare function readSimpleFakeApiHttpConfig(customPackageJsonPath?: string): PackageJsonHttpSection | undefined;
