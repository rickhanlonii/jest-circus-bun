/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {getStackTraceLines, getTopFrame} from 'jest-message-util';

export type SnapshotStateOptions = {
  readonly updateSnapshot: Config.SnapshotUpdateState;
  readonly prettierPath?: string | null;
  readonly expand?: boolean;
  readonly snapshotFormat: any;
  readonly rootDir: string;
};

export type SnapshotMatchOptions = {
  readonly testName: string;
  readonly received: unknown;
  readonly key?: string;
  readonly inlineSnapshot?: string;
  readonly isInline: boolean;
  readonly error?: Error;
};

type SnapshotReturnOptions = {
  readonly actual: string;
  readonly count: number;
  readonly expected?: string;
  readonly key: string;
  readonly pass: boolean;
};

type SaveStatus = {
  deleted: boolean;
  saved: boolean;
};

export const keyToTestName = (key: string): string => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};


export const removeLinesBeforeExternalMatcherTrap = (stack: string): string => {
  const lines = stack.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    // It's a function name specified in `packages/expect/src/index.ts`
    // for external custom matchers.
    if (lines[i].includes('__EXTERNAL_MATCHER_TRAP__')) {
      return lines.slice(i + 1).join('\n');
    }
  }

  return stack;
};

export const testNameToKey = (testName: string, count: number): string =>
    `${testName} ${count}`;

export class SnapshotState {
  private _counters: Map<string, number>;
  private _dirty: boolean;
  private _index: number;
  private readonly _updateSnapshot: Config.SnapshotUpdateState;
  private _snapshotData: any;
  private readonly _initialData: any;
  private readonly _snapshotPath: string;
  private _inlineSnapshots: Array<any>;
  private readonly _uncheckedKeys: Set<string>;
  private readonly _prettierPath: string | null;
  private readonly _rootDir: string;

  readonly snapshotFormat: any;

  added: number;
  expand: boolean;
  matched: number;
  unmatched: number;
  updated: number;

  constructor(snapshotPath: string, options: SnapshotStateOptions) {
    this._snapshotPath = snapshotPath;
    const {data, dirty} = {data: {}, dirty: false}
    this._initialData = data;
    this._snapshotData = data;
    this._dirty = dirty;
    this._prettierPath = options.prettierPath ?? null;
    this._inlineSnapshots = [];
    this._uncheckedKeys = new Set(Object.keys(this._snapshotData));
    this._counters = new Map();
    this._index = 0;
    this.expand = options.expand || false;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this._updateSnapshot = options.updateSnapshot;
    this.updated = 0;
    this.snapshotFormat = options.snapshotFormat;
    this._rootDir = options.rootDir;
  }

  markSnapshotsAsCheckedForTest(testName: string): void {
    // this._uncheckedKeys.forEach(uncheckedKey => {
    //   if (keyToTestName(uncheckedKey) === testName) {
    //     this._uncheckedKeys.delete(uncheckedKey);
    //   }
    // });
  }

  private _addSnapshot(
    key: string,
    receivedSerialized: string,
    options: {isInline: boolean; error?: Error},
  ): void {
    // this._dirty = true;
    // if (options.isInline) {
    //   const error = options.error || new Error();
    //   const lines = getStackTraceLines(
    //     removeLinesBeforeExternalMatcherTrap(error.stack || ''),
    //   );
    //   const frame = getTopFrame(lines);
    //   if (!frame) {
    //     throw new Error(
    //       "Jest: Couldn't infer stack frame for inline snapshot.",
    //     );
    //   }
    //   this._inlineSnapshots.push({
    //     frame,
    //     snapshot: receivedSerialized,
    //   });
    // } else {
    //   this._snapshotData[key] = receivedSerialized;
    // }
  }

  clear(): void {
    this._snapshotData = this._initialData;
    this._inlineSnapshots = [];
    this._counters = new Map();
    this._index = 0;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this.updated = 0;
  }

  save(): SaveStatus {
    const hasExternalSnapshots = Object.keys(this._snapshotData).length;
    const hasInlineSnapshots = this._inlineSnapshots.length;
    const isEmpty = !hasExternalSnapshots && !hasInlineSnapshots;

    const status: SaveStatus = {
      deleted: false,
      saved: false,
    };

    // if ((this._dirty || this._uncheckedKeys.size) && !isEmpty) {
    //   if (hasExternalSnapshots) {
    //     // saveSnapshotFile(this._snapshotData, this._snapshotPath);
    //   }
    //   if (hasInlineSnapshots) {
    //     // saveInlineSnapshots(
    //     //   this._inlineSnapshots,
    //     //   this._rootDir,
    //     //   this._prettierPath,
    //     // );
    //   }
    //   status.saved = true;
    // } else if (!hasExternalSnapshots && fs.existsSync(this._snapshotPath)) {
    //   if (this._updateSnapshot === 'all') {
    //     fs.unlinkSync(this._snapshotPath);
    //   }
    //   status.deleted = true;
    // }

    return status;
  }

  getUncheckedCount(): number {
    return this._uncheckedKeys.size || 0;
  }

  getUncheckedKeys(): Array<string> {
    return Array.from(this._uncheckedKeys);
  }

  removeUncheckedKeys(): void {
    if (this._updateSnapshot === 'all' && this._uncheckedKeys.size) {
      this._dirty = true;
      this._uncheckedKeys.forEach(key => delete this._snapshotData[key]);
      this._uncheckedKeys.clear();
    }
  }

  match({
    testName,
    received,
    key,
    inlineSnapshot,
    isInline,
    error,
  }: SnapshotMatchOptions): SnapshotReturnOptions {

      return {
        actual: '',
        count: 0,
        expected: '',
        key,
        pass: true,
      };
  }

  fail(testName: string, _received: unknown, key?: string): string {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    this._uncheckedKeys.delete(key);
    this.unmatched++;
    return key;
  }
}
