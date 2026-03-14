import { addIcoEntryFromPng } from '@application/use-cases/addIcoEntryFromPng/addIcoEntryFromPng';
import { addBlankIcoEntry } from '@application/use-cases/addBlankIcoEntry/addBlankIcoEntry';
import { exportIcoProject } from '@application/use-cases/exportIco/exportIcoProject';
import { importIcoProject } from '@application/use-cases/importIco/importIcoProject';
import { recordIcoProjectRevision } from '@application/use-cases/recordIcoProjectRevision/recordIcoProjectRevision';
import { redoIcoProject } from '@application/use-cases/redoIcoProject/redoIcoProject';
import { replaceIcoEntryWithPng } from '@application/use-cases/replaceIcoEntryWithPng/replaceIcoEntryWithPng';
import { undoIcoProject } from '@application/use-cases/undoIcoProject/undoIcoProject';
import { parseIcoBuffer } from '@infrastructure/codecs/ico/parseIcoBuffer';
import { describe, expect, it } from 'vitest';

import {
  createDibBackedIcoBuffer,
  createPngBackedIcoBuffer,
  createSolidPng,
} from './helpers/iconFixtures';

describe('ICO codec', () => {
  it('rejects ICO files that declare zero entries', () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);

    expect(() => parseIcoBuffer(invalidBuffer)).toThrowError(
      'The ICO file does not contain any entries.',
    );
  });

  it('rejects ICO files with a truncated directory table', () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);

    expect(() => parseIcoBuffer(invalidBuffer)).toThrowError(
      'The ICO directory table is truncated.',
    );
  });

  it('parses PNG-backed ICO entries', () => {
    const buffer = createPngBackedIcoBuffer(32, 32);
    const parsed = parseIcoBuffer(buffer);
    const entry = parsed.entries[0];

    expect(entry).toBeDefined();
    expect(entry).toMatchObject({
      width: 32,
      height: 32,
      payloadKind: 'png',
      bitCount: 32,
    });
    expect(entry?.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('parses DIB-backed ICO entries and generates a PNG preview', () => {
    const buffer = createDibBackedIcoBuffer(1, 1, {
      red: 0xc8,
      green: 0x64,
      blue: 0x32,
      alpha: 0xff,
    });
    const parsed = parseIcoBuffer(buffer);
    const entry = parsed.entries[0];

    expect(entry).toBeDefined();
    expect(entry).toMatchObject({
      width: 1,
      height: 1,
      payloadKind: 'dib',
      bitCount: 32,
    });
    expect(entry?.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('supports add and replace flows before export', () => {
    const sourceBuffer = createPngBackedIcoBuffer(16, 16);
    const initialSession = importIcoProject({
      projectId: 'ico-project',
      filePath: null,
      sourceName: 'dropped.ico',
      bytes: sourceBuffer,
    });
    const addedSession = addIcoEntryFromPng(
      initialSession,
      'added-entry',
      createSolidPng(32, 32, {
        red: 0x23,
        green: 0x45,
        blue: 0x67,
        alpha: 0xff,
      }),
      initialSession.workingEntries[0]?.id ?? null,
    );
    const replacedSession = replaceIcoEntryWithPng(
      addedSession,
      addedSession.workingEntries[0]?.id ?? '',
      createSolidPng(24, 24, {
        red: 0xa1,
        green: 0xb2,
        blue: 0xc3,
        alpha: 0xff,
      }),
    );
    const exportedBuffer = exportIcoProject(replacedSession);
    const exported = parseIcoBuffer(exportedBuffer);

    expect(initialSession.name).toBe('dropped.ico');
    expect(replacedSession.isDirty).toBe(true);
    expect(
      exported.entries.map((entry) => `${entry.width}x${entry.height}`),
    ).toEqual(['24x24', '32x32']);
  });

  it('creates a blank ICO entry that can be edited later', () => {
    const initialSession = importIcoProject({
      projectId: 'blank-ico-project',
      filePath: null,
      sourceName: 'blank.ico',
      bytes: createPngBackedIcoBuffer(16, 16),
    });
    const updatedSession = addBlankIcoEntry(
      initialSession,
      'blank-entry',
      32,
      initialSession.workingEntries[0]?.id ?? null,
    );

    expect(updatedSession.isDirty).toBe(true);
    expect(
      updatedSession.workingEntries.map(
        (entry) => `${entry.width}x${entry.height}`,
      ),
    ).toEqual(['16x16', '32x32']);
    expect(updatedSession.workingEntries[1]?.previewDataUrl).toMatch(
      /^data:image\/png;base64,/,
    );
  });

  it('supports committed undo and redo across ICO revisions', () => {
    const initialSession = importIcoProject({
      projectId: 'history-ico-project',
      filePath: null,
      sourceName: 'history.ico',
      bytes: createPngBackedIcoBuffer(16, 16),
    });
    const nextSession = replaceIcoEntryWithPng(
      initialSession,
      initialSession.workingEntries[0]?.id ?? '',
      createSolidPng(32, 32, {
        red: 0x5c,
        green: 0x88,
        blue: 0xb0,
        alpha: 0xff,
      }),
    );
    const recordedSession = recordIcoProjectRevision(
      initialSession,
      nextSession,
    );
    const undoneSession = undoIcoProject(recordedSession);
    const redoneSession = redoIcoProject(undoneSession);

    expect(recordedSession.undoStack).toHaveLength(1);
    expect(undoneSession.workingEntries[0]?.width).toBe(16);
    expect(undoneSession.isDirty).toBe(false);
    expect(redoneSession.workingEntries[0]?.width).toBe(32);
    expect(redoneSession.isDirty).toBe(true);
  });
});
