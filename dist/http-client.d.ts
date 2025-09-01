import type { CreateOptions, Client } from './utils/types.js';
export type { Client } from './utils/types.js';
export type { Request, Response } from 'express';
export declare function create(endpointName: string, options?: CreateOptions, customPackageJsonPath?: string): Client;
