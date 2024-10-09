"use strict";
/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_LOCATION = exports.COMMON_AUTHORITY_URL = exports.REDIRECT_URI = void 0;
/**
 * Redirect URI for the application
 */
exports.REDIRECT_URI = 'msal://redirect';
/**
 * Common authority URL for Microsoft identity platform
 */
exports.COMMON_AUTHORITY_URL = 'https://login.microsoftonline.com/common/';
/**
 * Location of the cache file
 */
exports.CACHE_LOCATION = './data/cache.json';
