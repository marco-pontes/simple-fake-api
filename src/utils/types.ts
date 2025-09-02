import express from 'express';

// Centralized types for the library

export interface SimpleFakeApiConfig {
    port: number;
    apiDir: string;
    collectionsDir: string;
    wildcardChar: string;
    routeFileExtension?: 'js' | 'ts';
    http?: {
        endpoints: Record<string, Record<string, { baseUrl: string; headers?: Record<string, string> }>>;
    };
}

export interface SimpleFakeApi {
  config: SimpleFakeApiConfig;
  app: express.Express;
  collections: object;
}

export interface DataCollections {
  [key: string]: any[];
}

export interface RouteHandlers {
  [key: string]: (req: any, res: any) => void;
}

export interface RouteDefinition {
  route: string;
  method: string;
  handler: (req: any, res: any) => void;
}

// HTTP client related types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface EndpointConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export type Environment = 'dev' | 'prod' | 'staging' | 'test';
export type EnvironmentMap = Record<Environment, EndpointConfig>;

export interface HttpClientConfig {
  endpoints: Record<string, {
    dev: EndpointConfig;
    prod?: EndpointConfig;
    staging?: EndpointConfig;
    test?: EndpointConfig;
    default?: keyof EnvironmentMap;
  }>;
  resolveEnv?: () => keyof EnvironmentMap;
}

export interface CreateOptions {
  headers?: Record<string, string>;
}

export interface Client {
  get: (path: string, init?: RequestInit) => Promise<Response>;
  post: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  put: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  patch: (path: string, body?: any, init?: RequestInit) => Promise<Response>;
  delete: (path: string, init?: RequestInit) => Promise<Response>;
  head: (path: string, init?: RequestInit) => Promise<Response>;
  options: (path: string, init?: RequestInit) => Promise<Response>;
  request: (method: HttpMethod, path: string, init?: RequestInit) => Promise<Response>;
  baseUrl: string;
  headers: Record<string, string>;
}

// Bundler-related types
export interface InjectedHttpConfig {
  endpoints: Record<string, { baseUrl: string; headers?: Record<string, string> }>;
}

export interface FullConfigFileShape {
  port: number;
  apiDir: string;
  collectionsDir: string;
  wildcardChar: string;
  http?: {
    endpoints: Record<string, Record<string, { baseUrl: string; headers?: Record<string, string> }>>;
  };
}
