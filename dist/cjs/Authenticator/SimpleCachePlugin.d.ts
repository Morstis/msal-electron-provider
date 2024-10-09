/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
/**
 * PLEASE DO NOT USE THIS IN PRODUCTION ENVIRONMENTS.
 */
export declare const SimpleCachePlugin: {
    beforeCacheAccess: (cacheContext: any) => Promise<void>;
    afterCacheAccess: (cacheContext: any) => Promise<void>;
};
