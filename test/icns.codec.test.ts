import { addIcnsSlotFromPng } from '@application/use-cases/addIcnsSlotFromPng/addIcnsSlotFromPng';
import { addBlankIcnsSlot } from '@application/use-cases/addBlankIcnsSlot/addBlankIcnsSlot';
import { createIcnsProject } from '@application/use-cases/createIcnsProject/createIcnsProject';
import { exportIcnsProject } from '@application/use-cases/exportIcns/exportIcnsProject';
import { importIcnsProject } from '@application/use-cases/importIcns/importIcnsProject';
import { recordIcnsProjectRevision } from '@application/use-cases/recordIcnsProjectRevision/recordIcnsProjectRevision';
import { redoIcnsProject } from '@application/use-cases/redoIcnsProject/redoIcnsProject';
import { removeIcnsChunk } from '@application/use-cases/removeIcnsChunk/removeIcnsChunk';
import { replaceIcnsChunkWithPng } from '@application/use-cases/replaceIcnsChunkWithPng/replaceIcnsChunkWithPng';
import { undoIcnsProject } from '@application/use-cases/undoIcnsProject/undoIcnsProject';
import { parseIcnsBuffer } from '@infrastructure/codecs/icns/parseIcnsBuffer';
import { describe, expect, it } from 'vitest';

import { createIcnsBuffer, createSolidPng } from './helpers/iconFixtures';

describe('ICNS codec', () => {
  it('rejects ICNS files that do not contain any chunk elements', () => {
    const invalidBuffer = Buffer.alloc(8);
    invalidBuffer.write('icns', 0, 'ascii');
    invalidBuffer.writeUInt32BE(8, 4);

    expect(() => parseIcnsBuffer(invalidBuffer)).toThrowError(
      'The ICNS file does not contain any chunk elements.',
    );
  });

  it('rejects ICNS files with a truncated chunk header at the end', () => {
    const invalidBuffer = Buffer.alloc(12);
    invalidBuffer.write('icns', 0, 'ascii');
    invalidBuffer.writeUInt32BE(12, 4);

    expect(() => parseIcnsBuffer(invalidBuffer)).toThrowError(
      'The ICNS chunk header is truncated at the end of the file.',
    );
  });

  it('parses canonical PNG-backed ICNS chunks', () => {
    const buffer = createIcnsBuffer([
      {
        type: 'icp4',
        payload: createSolidPng(16, 16),
      },
    ]);
    const parsed = parseIcnsBuffer(buffer);
    const chunk = parsed.chunks[0];

    expect(chunk).toBeDefined();
    expect(chunk).toMatchObject({
      type: 'icp4',
      payloadFamily: 'png',
      isSupported: true,
    });
    expect(chunk?.slot?.label).toBe('16x16@1x');
    expect(chunk?.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('adds a missing canonical slot and exports canonical PNG-backed ICNS', () => {
    const sourceBuffer = createIcnsBuffer([
      {
        type: 'icp4',
        payload: createSolidPng(16, 16),
      },
    ]);
    const initialSession = importIcnsProject({
      projectId: 'icns-project',
      filePath: null,
      sourceName: 'dropped.icns',
      bytes: sourceBuffer,
    });
    const addedSession = addIcnsSlotFromPng(
      initialSession,
      'added-ic11',
      'ic11',
      createSolidPng(32, 32, {
        red: 0x11,
        green: 0x99,
        blue: 0xcc,
        alpha: 0xff,
      }),
    );
    const exportedBuffer = exportIcnsProject(addedSession);
    const exported = parseIcnsBuffer(exportedBuffer);

    expect(initialSession.name).toBe('dropped.icns');
    expect(addedSession.isDirty).toBe(true);
    expect(addedSession.workingChunks.map((chunk) => chunk.type)).toEqual([
      'icp4',
      'ic11',
    ]);
    expect(exported.chunks.map((chunk) => chunk.type)).toEqual([
      'icp4',
      'ic11',
    ]);
    expect(
      exported.chunks.every((chunk) => chunk.payloadFamily === 'png'),
    ).toBe(true);
  });

  it('replaces an existing ICNS slot with a validated PNG payload', () => {
    const originalPayload = createSolidPng(16, 16, {
      red: 0x35,
      green: 0x54,
      blue: 0x77,
      alpha: 0xff,
    });
    const replacementPayload = createSolidPng(16, 16, {
      red: 0xee,
      green: 0xaa,
      blue: 0x44,
      alpha: 0xff,
    });
    const sourceBuffer = createIcnsBuffer([
      {
        type: 'icp4',
        payload: originalPayload,
      },
    ]);
    const initialSession = importIcnsProject({
      projectId: 'replace-icns-project',
      filePath: null,
      sourceName: 'replace.icns',
      bytes: sourceBuffer,
    });
    const replacedSession = replaceIcnsChunkWithPng(
      initialSession,
      initialSession.workingChunks[0]?.id ?? '',
      replacementPayload,
    );
    const exportedBuffer = exportIcnsProject(replacedSession);
    const exported = parseIcnsBuffer(exportedBuffer);

    expect(replacedSession.isDirty).toBe(true);
    expect(exported.chunks[0]?.payload.equals(replacementPayload)).toBe(true);
    expect(exported.chunks[0]?.slot?.chunkType).toBe('icp4');
  });

  it('creates a blank canonical ICNS slot for direct drawing', () => {
    const initialSession = createIcnsProject({
      projectId: 'blank-icns-project',
    });
    const updatedSession = addBlankIcnsSlot(
      initialSession,
      'blank-icp4',
      'icp4',
    );

    expect(updatedSession.isDirty).toBe(true);
    expect(updatedSession.workingChunks.map((chunk) => chunk.type)).toEqual([
      'icp4',
    ]);
    expect(updatedSession.workingChunks[0]?.slot?.chunkType).toBe('icp4');
    expect(updatedSession.workingChunks[0]?.previewDataUrl).toMatch(
      /^data:image\/png;base64,/,
    );
  });

  it('removes an ICNS chunk and preserves a valid editable empty session', () => {
    const initialSession = importIcnsProject({
      projectId: 'remove-icns-project',
      filePath: null,
      sourceName: 'remove.icns',
      bytes: createIcnsBuffer([
        {
          type: 'icp4',
          payload: createSolidPng(16, 16),
        },
      ]),
    });
    const updatedSession = removeIcnsChunk(
      initialSession,
      initialSession.workingChunks[0]?.id ?? '',
    );

    expect(updatedSession.isDirty).toBe(true);
    expect(updatedSession.workingChunks).toHaveLength(0);
  });

  it('supports committed undo and redo across ICNS revisions', () => {
    const initialSession = importIcnsProject({
      projectId: 'history-icns-project',
      filePath: null,
      sourceName: 'history.icns',
      bytes: createIcnsBuffer([
        {
          type: 'icp4',
          payload: createSolidPng(16, 16),
        },
      ]),
    });
    const nextSession = replaceIcnsChunkWithPng(
      initialSession,
      initialSession.workingChunks[0]?.id ?? '',
      createSolidPng(16, 16, {
        red: 0xbb,
        green: 0x66,
        blue: 0x44,
        alpha: 0xff,
      }),
    );
    const recordedSession = recordIcnsProjectRevision(
      initialSession,
      nextSession,
    );
    const undoneSession = undoIcnsProject(recordedSession);
    const redoneSession = redoIcnsProject(undoneSession);

    expect(recordedSession.undoStack).toHaveLength(1);
    expect(undoneSession.isDirty).toBe(false);
    expect(
      undoneSession.workingChunks[0]?.payload.equals(
        initialSession.savedChunks[0]?.payload ?? Buffer.alloc(0),
      ),
    ).toBe(true);
    expect(redoneSession.isDirty).toBe(true);
    expect(
      redoneSession.workingChunks[0]?.payload.equals(
        nextSession.workingChunks[0]?.payload ?? Buffer.alloc(0),
      ),
    ).toBe(true);
  });
});
