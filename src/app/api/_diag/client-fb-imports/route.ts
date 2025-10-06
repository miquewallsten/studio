
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

async function findClientImports(dir: string): Promise<{ file: string; lines: { line: number; text: string }[] }[]> {
    let results: { file: string; lines: { line: number; text: string }[] }[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.next') {
                results = results.concat(await findClientImports(fullPath));
            }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.trim().startsWith("'use client'")) {
                const lines = content.split('\n');
                const matchingLines: { line: number; text: string }[] = [];
                const importRegex = /from ['"](@?firebase\/|firebase\/)/;

                lines.forEach((line, index) => {
                    if (importRegex.test(line)) {
                        matchingLines.push({ line: index + 1, text: line.trim() });
                    }
                });

                if (matchingLines.length > 0) {
                    results.push({
                        file: fullPath.replace(process.cwd(), ''),
                        lines: matchingLines,
                    });
                }
            }
        }
    }
    return results;
}

export async function GET(request: Request) {
    try {
        const decodedToken = await requireAuth(request as any);
        requireRole(((decodedToken as any).role ?? 'Unassigned'), 'Admin');

        const offendingFiles = await findClientImports(path.join(process.cwd(), 'src'));

        return NextResponse.json({ ok: true, files: offendingFiles });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: e.status || 500 });
    }
}
