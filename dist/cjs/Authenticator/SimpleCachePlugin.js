"use strict";
/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCachePlugin = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * NOTE : This is a simple cache plugin made for the purpose of demonstrating caching support for the Electron Provider.
 * PLEASE DO NOT USE THIS IN PRODUCTION ENVIRONMENTS.
 */
const fs_1 = require("fs");
const path_1 = require("path");
const Constants_1 = require("./Constants");
/**
 * Reads tokens from storage if exists and stores an in-memory copy.
 *
 * @param {*} cacheContext
 * @return {*}
 */
const beforeCacheAccess = (cacheContext) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line no-console
    console.warn("🦒: PLEASE DO NOT USE THIS CACHE PLUGIN IN PRODUCTION ENVIRONMENTS!!!!");
    return new Promise((resolve, reject) => {
        if ((0, fs_1.existsSync)(Constants_1.CACHE_LOCATION)) {
            (0, fs_1.readFile)(Constants_1.CACHE_LOCATION, "utf-8", (err, data) => {
                if (err) {
                    reject();
                }
                else {
                    cacheContext.tokenCache.deserialize(data);
                    resolve();
                }
            });
        }
        else {
            const dir = (0, path_1.dirname)(Constants_1.CACHE_LOCATION);
            if (!(0, fs_1.existsSync)(dir)) {
                (0, fs_1.mkdirSync)(dir);
            }
            (0, fs_1.writeFile)(Constants_1.CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
                if (err) {
                    reject();
                }
            });
        }
    });
});
/**
 * Writes token to storage.
 *
 * @param {*} cacheContext
 */
const afterCacheAccess = (cacheContext) => __awaiter(void 0, void 0, void 0, function* () {
    if (cacheContext.cacheHasChanged) {
        const dir = (0, path_1.dirname)(Constants_1.CACHE_LOCATION);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir);
        }
        yield (0, fs_1.writeFile)(Constants_1.CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
            if (err) {
                // eslint-disable-next-line no-console
                console.log("🦒: ", err);
            }
        });
    }
});
/**
 * PLEASE DO NOT USE THIS IN PRODUCTION ENVIRONMENTS.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
exports.SimpleCachePlugin = {
    beforeCacheAccess,
    afterCacheAccess,
};
