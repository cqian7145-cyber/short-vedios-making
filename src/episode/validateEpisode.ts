import { DEFAULT_OVERLAP_FRAMES } from '../engine/timeline';
import { EpisodeSchema, type Episode } from './schema';
export function validateEpisode(input: unknown, source = 'episode JSON'): Episode {
    const fail = (path: string, message: string): never => { throw new Error(`${source}: ${path}: ${message}`); };
    if (typeof input === 'object' && input !== null && 'schemaVersion' in input && input.schemaVersion !== 1)
        fail('schemaVersion', `Unsupported schema version; expected 1, received ${JSON.stringify(input.schemaVersion)}`);
    const parsed = EpisodeSchema.safeParse(input);
    if (!parsed.success) {
        const lines = parsed.error.issues.map(issue => {
            const path = issue.path.map((part, i) => typeof part === 'number' ? `[${part}]` : `${i ? '.' : ''}${String(part)}`).join('');
            let value: unknown = input;
            for (const key of issue.path)
                value = value !== null && typeof value === 'object' ? Reflect.get(value, key) : undefined;
            const expected = issue.code === 'invalid_union' && issue.path[issue.path.length - 1] === 'type' ? 'Expected scene type: hook, setup, history, diagram, simulation, comparison, reveal, explanation, ending' : issue.message;
            return `${path || '<root>'}: ${expected}; received ${JSON.stringify(value) ?? 'missing'}`;
        });
        throw new Error(`${source}: validation failed\n${lines.join('\n')}`);
    }
    const e = parsed.data;
    const unique = (values: readonly string[], path: string) => { const seen = new Set<string>(); values.forEach((v, i) => { if (seen.has(v))
        fail(`${path}[${i}]`, `expected unique ID; received duplicate "${v}"`); seen.add(v); }); };
    const ref = (value: string | undefined, ids: readonly string[], path: string) => { if (value !== undefined && !ids.includes(value))
        fail(path, `expected existing reference (${ids.join(', ')}); received "${value}"`); };
    unique(e.scenes.map(s => s.id), 'scenes');
    unique(Object.values(e.networks).map(n => n.id), 'networks');
    for (const [key, n] of Object.entries(e.networks)) {
        const p = `networks.${key}`;
        if (key !== n.id)
            fail(`${p}.id`, `expected map key "${key}"; received "${n.id}"`);
        unique(n.nodes.map(x => x.id), `${p}.nodes`);
        unique(n.edges.map(x => x.id), `${p}.edges`);
        unique(n.routes.map(x => x.id), `${p}.routes`);
        const nodes = n.nodes.map(x => x.id);
        n.edges.forEach((edge, i) => { ref(edge.from, nodes, `${p}.edges[${i}].from`); ref(edge.to, nodes, `${p}.edges[${i}].to`); });
        ref(n.addedEdgeId, n.edges.map(x => x.id), `${p}.addedEdgeId`);
        ref(n.bottleneck?.nodeId, nodes, `${p}.bottleneck.nodeId`);
    }
    let total = 0;
    e.scenes.forEach((s, i) => {
        const p = `scenes[${i}]`;
        const frames = Math.round(s.durationSeconds * e.fps);
        if (!Number.isSafeInteger(frames) || frames < 1)
            fail(`${p}.durationSeconds`, 'expected at least one frame and a safe integer after rounding');
        const overlap = i === 0 ? 0 : Math.round(s.transition?.overlapSeconds === undefined ? DEFAULT_OVERLAP_FRAMES : s.transition.overlapSeconds * e.fps);
        if (i > 0 && (overlap >= frames || overlap >= Math.round(e.scenes[i - 1].durationSeconds * e.fps)))
            fail(`${p}.transition.overlapSeconds`, 'expected overlap shorter than both neighboring scenes');
        total += frames - overlap;
        const c = s.content;
        if ('networkId' in c && c.networkId !== undefined) {
            ref(c.networkId, Object.keys(e.networks), `${p}.content.networkId`);
            const n = e.networks[c.networkId];
            const nodes = n.nodes.map(x => x.id), edges = n.edges.map(x => x.id), routes = n.routes.map(x => x.id);
            if ('highlightNodeId' in c)
                ref(c.highlightNodeId, nodes, `${p}.content.highlightNodeId`);
            if ('focusNodeId' in c)
                ref(c.focusNodeId, nodes, `${p}.content.focusNodeId`);
            if ('highlightEdgeId' in c)
                ref(c.highlightEdgeId, edges, `${p}.content.highlightEdgeId`);
            if ('annotations' in c)
                c.annotations.forEach((a, j) => ref(a.anchorNodeId, nodes, `${p}.content.annotations[${j}].anchorNodeId`));
            if ('mode' in c && c.mode === 'networkFlow') {
                ref(c.addedEdgeId, edges, `${p}.content.addedEdgeId`);
                ref(c.newRouteId, routes, `${p}.content.newRouteId`);
                for (const field of ['baselineRouteCounts', 'redistributedRouteCounts'] as const)
                    Object.keys(c[field]).forEach(key => ref(key, routes, `${p}.content.${field}.${key}`));
            }
        }
        if ('mode' in c && c.mode === 'bidding') {
            const ids = c.participants.map(x => x.id);
            unique(ids, `${p}.content.participants`);
            c.bids.forEach((b, j) => ref(b.bidderId, ids, `${p}.content.bids[${j}].bidderId`));
        }
    });
    if (!Number.isSafeInteger(total) || total < 1)
        fail('scenes', 'expected positive total duration');
    return e;
}
